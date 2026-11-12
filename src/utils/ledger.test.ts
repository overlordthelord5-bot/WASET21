import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCommission,
  validateLedgerBalance,
  createBookingLedgerTransaction,
  createRefundLedgerTransaction,
  egpToPiasters,
  piastersToEgp,
} from './ledger';

test('piaster conversion precision', () => {
  assert.equal(egpToPiasters(100), 10000);
  assert.equal(egpToPiasters(99.5), 9950);
  assert.equal(piastersToEgp(10000), 100);
  assert.equal(piastersToEgp(9950), 99.5);
});

test('calculateCommission calculates default 15% platform commission correctly', () => {
  const result = calculateCommission(1000, 15);
  assert.equal(result.totalAmountEgp, 1000);
  assert.equal(result.totalPiasters, 100000);
  assert.equal(result.platformFeePercent, 15);
  assert.equal(result.platformFeeEgp, 150);
  assert.equal(result.platformFeePiasters, 15000);
  assert.equal(result.netConsultantEgp, 850);
  assert.equal(result.netConsultantPiasters, 85000);
});

test('calculateCommission calculates affiliate commission 8% when applicable', () => {
  const result = calculateCommission(1000, 15, 8);
  assert.equal(result.platformFeeEgp, 150);
  assert.equal(result.affiliateCommissionEgp, 80);
  assert.equal(result.affiliateCommissionPiasters, 8000);
});

test('validateLedgerBalance accepts balanced transactions and rejects unbalanced ones', () => {
  const balanced = [
    { accountCode: '1010', accountName: 'Cash', debitPiasters: 50000, creditPiasters: 0 },
    { accountCode: '2010', accountName: 'Payable', debitPiasters: 0, creditPiasters: 50000 },
  ];
  const resBalanced = validateLedgerBalance(balanced);
  assert.equal(resBalanced.isBalanced, true);
  assert.equal(resBalanced.differencePiasters, 0);

  const unbalanced = [
    { accountCode: '1010', accountName: 'Cash', debitPiasters: 50000, creditPiasters: 0 },
    { accountCode: '2010', accountName: 'Payable', debitPiasters: 0, creditPiasters: 40000 },
  ];
  const resUnbalanced = validateLedgerBalance(unbalanced);
  assert.equal(resUnbalanced.isBalanced, false);
  assert.equal(resUnbalanced.differencePiasters, 10000);
});

test('createBookingLedgerTransaction creates strictly balanced transaction for escrow booking', () => {
  const tx = createBookingLedgerTransaction('BK-999', 1500, 15, 'IDEM-KEY-001');
  assert.equal(tx.isBalanced, true);
  assert.equal(tx.totalDebitsPiasters, 150000);
  assert.equal(tx.totalCreditsPiasters, 150000);
  assert.equal(tx.totalDebitsPiasters, tx.totalCreditsPiasters);
  assert.equal(tx.entries.length, 3);
});

test('createRefundLedgerTransaction creates balanced reversing entry', () => {
  const originalTx = createBookingLedgerTransaction('BK-999', 2000, 15, 'IDEM-KEY-ORIG');
  const refundTx = createRefundLedgerTransaction(originalTx, 'Client cancellation requested', 'IDEM-KEY-REF');

  assert.equal(refundTx.isBalanced, true);
  assert.equal(refundTx.totalDebitsPiasters, originalTx.totalCreditsPiasters);
  assert.equal(refundTx.totalCreditsPiasters, originalTx.totalDebitsPiasters);
});
