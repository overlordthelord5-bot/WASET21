import { LedgerEntry, LedgerTransaction } from '../types';

export const DEFAULT_PLATFORM_COMMISSION_PERCENT = 15;
export const DEFAULT_AFFILIATE_COMMISSION_PERCENT = 8;

/**
 * Converts EGP to Piasters (integer). 1 EGP = 100 Piasters.
 * Uses Math.round to prevent floating point representation errors.
 */
export function egpToPiasters(egp: number): number {
  return Math.round(egp * 100);
}

/**
 * Converts Piasters back to EGP.
 */
export function piastersToEgp(piasters: number): number {
  return piasters / 100;
}

export interface CommissionBreakdown {
  totalAmountEgp: number;
  totalPiasters: number;
  platformFeePercent: number;
  platformFeeEgp: number;
  platformFeePiasters: number;
  netConsultantEgp: number;
  netConsultantPiasters: number;
  affiliateCommissionPercent?: number;
  affiliateCommissionEgp?: number;
  affiliateCommissionPiasters?: number;
}

/**
 * Calculates platform and optional affiliate commission strictly in integer piasters.
 */
export function calculateCommission(
  grossAmountEgp: number,
  platformFeePercent: number = DEFAULT_PLATFORM_COMMISSION_PERCENT,
  affiliateFeePercent?: number
): CommissionBreakdown {
  if (grossAmountEgp <= 0) {
    throw new Error('Gross amount must be positive');
  }
  if (platformFeePercent < 0 || platformFeePercent > 100) {
    throw new Error('Platform fee percentage must be between 0 and 100');
  }

  const totalPiasters = egpToPiasters(grossAmountEgp);
  const platformFeePiasters = Math.round((totalPiasters * platformFeePercent) / 100);
  const netConsultantPiasters = totalPiasters - platformFeePiasters;

  let affiliateCommissionPiasters = 0;
  let affiliateCommissionEgp = 0;

  if (affiliateFeePercent && affiliateFeePercent > 0) {
    // Affiliate fee is paid out from platform fee or designated margin
    affiliateCommissionPiasters = Math.round((totalPiasters * affiliateFeePercent) / 100);
    affiliateCommissionEgp = piastersToEgp(affiliateCommissionPiasters);
  }

  return {
    totalAmountEgp: grossAmountEgp,
    totalPiasters,
    platformFeePercent,
    platformFeeEgp: piastersToEgp(platformFeePiasters),
    platformFeePiasters,
    netConsultantEgp: piastersToEgp(netConsultantPiasters),
    netConsultantPiasters,
    affiliateCommissionPercent: affiliateFeePercent,
    affiliateCommissionEgp,
    affiliateCommissionPiasters,
  };
}

/**
 * Validates that a ledger transaction has balanced Debits and Credits.
 * Total Debits === Total Credits.
 */
export function validateLedgerBalance(entries: LedgerEntry[]): {
  isBalanced: boolean;
  totalDebitsPiasters: number;
  totalCreditsPiasters: number;
  differencePiasters: number;
} {
  if (!entries || entries.length < 2) {
    return {
      isBalanced: false,
      totalDebitsPiasters: 0,
      totalCreditsPiasters: 0,
      differencePiasters: 0,
    };
  }

  let totalDebits = 0;
  let totalCredits = 0;

  for (const entry of entries) {
    if (entry.debitPiasters < 0 || entry.creditPiasters < 0) {
      throw new Error('Debit and credit amounts cannot be negative');
    }
    totalDebits += Math.round(entry.debitPiasters);
    totalCredits += Math.round(entry.creditPiasters);
  }

  const difference = totalDebits - totalCredits;
  return {
    isBalanced: difference === 0,
    totalDebitsPiasters: totalDebits,
    totalCreditsPiasters: totalCredits,
    differencePiasters: difference,
  };
}

/**
 * Creates balanced double-entry ledger entries for a confirmed booking with Escrow.
 * 1. Client pays into Escrow Cash Account (Debit Cash / Escrow)
 * 2. Platform creates Escrow Liability (Credit Consultant Payable / Platform Revenue)
 */
export function createBookingLedgerTransaction(
  bookingId: string,
  grossAmountEgp: number,
  platformFeePercent: number = DEFAULT_PLATFORM_COMMISSION_PERCENT,
  idempotencyKey: string,
  postedBy: string = 'SYSTEM'
): LedgerTransaction {
  const comm = calculateCommission(grossAmountEgp, platformFeePercent);

  // Balanced entries:
  // Dr. 1010-ESCROW-FUNDS (Total Piasters)
  // Cr. 2010-CONSULTANT-ESCROW-PAYABLE (Net Consultant Piasters)
  // Cr. 4010-PLATFORM-COMMISSION-EARNED (Platform Fee Piasters)
  const entries: LedgerEntry[] = [
    {
      accountCode: '1010-ESCROW-FUNDS',
      accountName: 'حساب أموال الضمان المجمعة (Escrow Funds)',
      debitPiasters: comm.totalPiasters,
      creditPiasters: 0,
    },
    {
      accountCode: '2010-CONSULTANT-ESCROW-PAYABLE',
      accountName: 'مستحقات المستشار المعلقة تحت الضمان',
      debitPiasters: 0,
      creditPiasters: comm.netConsultantPiasters,
    },
    {
      accountCode: '4010-PLATFORM-COMMISSION-EARNED',
      accountName: 'إيرادات عمولة وساطة منصة وسيط',
      debitPiasters: 0,
      creditPiasters: comm.platformFeePiasters,
    },
  ];

  const balance = validateLedgerBalance(entries);
  if (!balance.isBalanced) {
    throw new Error(`Unbalanced ledger entry created! Diff: ${balance.differencePiasters}`);
  }

  return {
    id: `TX-BK-${bookingId}-${Date.now()}`,
    date: new Date().toISOString(),
    description: `تسجيل حجز استشارة رقم #${bookingId} وإيداع القيمة في حساب الضمان مع احتساب عمولة المنصة ${platformFeePercent}%`,
    referenceType: 'booking',
    referenceId: bookingId,
    idempotencyKey,
    entries,
    totalDebitsPiasters: balance.totalDebitsPiasters,
    totalCreditsPiasters: balance.totalCreditsPiasters,
    isBalanced: true,
    postedBy,
  };
}

/**
 * Creates balanced reversing ledger entries for a refund (Double-Entry Reversal).
 * Never directly mutates or deletes posted entries; creates offsetting reversal.
 */
export function createRefundLedgerTransaction(
  originalTransaction: LedgerTransaction,
  refundReason: string,
  idempotencyKey: string,
  postedBy: string = 'ADMIN_DISPUTE'
): LedgerTransaction {
  // Exact reversal of the original transaction entries
  const reversalEntries: LedgerEntry[] = originalTransaction.entries.map((entry) => ({
    accountCode: entry.accountCode,
    accountName: `${entry.accountName} (قيد عكسي / استرداد)`,
    debitPiasters: entry.creditPiasters, // Swap debit and credit
    creditPiasters: entry.debitPiasters,
  }));

  const balance = validateLedgerBalance(reversalEntries);
  if (!balance.isBalanced) {
    throw new Error('Reversal transaction is not balanced!');
  }

  return {
    id: `TX-REFUND-${originalTransaction.referenceId}-${Date.now()}`,
    date: new Date().toISOString(),
    description: `قيد تسوية عكسي واسترداد للعملية #${originalTransaction.id} - السبب: ${refundReason}`,
    referenceType: 'refund',
    referenceId: originalTransaction.referenceId,
    idempotencyKey,
    entries: reversalEntries,
    totalDebitsPiasters: balance.totalDebitsPiasters,
    totalCreditsPiasters: balance.totalCreditsPiasters,
    isBalanced: true,
    postedBy,
  };
}
