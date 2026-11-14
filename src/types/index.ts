export type UserRole =
  | 'client'
  | 'consultant'
  | 'seller'
  | 'affiliate'
  | 'partner'
  | 'support'
  | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  isVerified: boolean;
  registeredAt: string;
  preferredLanguage: 'ar' | 'en';
}

export type DeliveryMode = 'video' | 'audio' | 'chat' | 'written' | 'in_person';

export interface Category {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  iconName: string;
  consultantCount: number;
  serviceCount: number;
  featured?: boolean;
}

export interface ConsultantQualification {
  degree: string;
  institution: string;
  year: number;
  isVerified: boolean;
}

export interface ConsultantCertification {
  title: string;
  issuer: string;
  licenseNumber?: string;
  issueDate: string;
  isVerified: boolean;
}

export interface ConsultantProfile {
  id: string;
  userId: string;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  bioAr: string;
  bioEn: string;
  avatar: string;
  categoryIds: string[];
  yearsExperience: number;
  sessionRateEgp: number; // in EGP
  sessionDurationMinutes: number;
  languages: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationNotes?: string;
  rating: number;
  reviewCount: number;
  deliveryModes: DeliveryMode[];
  qualifications: ConsultantQualification[];
  certifications: ConsultantCertification[];
  skills: string[];
  city: string;
  isDemo: boolean;
}

export interface ConsultationService {
  id: string;
  consultantId: string;
  categoryId: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  priceEgp: number;
  durationMinutes: number;
  deliveryMode: DeliveryMode;
  deliverablesAr: string[];
  prerequisitesAr: string[];
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
}

export interface AvailabilityRule {
  id: string;
  consultantId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  startTime: string; // '09:00'
  endTime: string; // '17:00'
  sessionDurationMinutes: number;
  bufferMinutes: number;
  advanceNoticeHours: number;
  futureWindowDays: number;
  isActive: boolean;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'disputed';

export type PaymentStatus =
  | 'unpaid'
  | 'held_in_escrow'
  | 'released_to_consultant'
  | 'refunded_to_client';

export interface Booking {
  id: string;
  bookingNumber: string;
  clientId: string;
  clientName: string;
  consultantId: string;
  consultantName: string;
  serviceId?: string;
  serviceTitle: string;
  categoryId: string;
  deliveryMode: DeliveryMode;
  notes: string;
  priceEgp: number;
  platformFeeEgp: number; // 15%
  netConsultantEgp: number;
  status: BookingStatus;
  scheduledAt: string; // ISO 8601 string
  durationMinutes: number;
  meetingUrl?: string;
  paymentMethod: 'fawry' | 'vodafone_cash' | 'meeza' | 'card_online';
  paymentStatus: PaymentStatus;
  isEscrowHeld: boolean;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RFQProposal {
  id: string;
  rfqId: string;
  consultantId: string;
  consultantName: string;
  consultantAvatar: string;
  consultantRating: number;
  proposedPriceEgp: number;
  executionDays: number;
  coverNote: string;
  status: 'submitted' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
}

export interface RFQRequest {
  id: string;
  rfqNumber: string;
  clientId: string;
  clientName: string;
  categoryId: string;
  title: string;
  description: string;
  budgetMinEgp: number;
  budgetMaxEgp: number;
  requiredByDate: string;
  status: 'open' | 'awarded' | 'closed' | 'cancelled';
  proposals: RFQProposal[];
  createdAt: string;
}

export interface OrderDeliverable {
  id: string;
  title: string;
  description: string;
  fileUrl?: string;
  submittedAt: string;
}

export interface OrderWorkspaceItem {
  id: string;
  orderNumber: string;
  bookingId: string;
  clientId: string;
  clientName: string;
  consultantId: string;
  consultantName: string;
  serviceTitle: string;
  amountEgp: number;
  platformFeeEgp: number;
  status: 'active' | 'deliverable_submitted' | 'revision_requested' | 'completed' | 'disputed';
  deliverables: OrderDeliverable[];
  revisionRequests: string[];
  maxRevisions: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  attachmentName?: string;
  timestamp: string;
  isRead: boolean;
}

export interface Dispute {
  id: string;
  disputeNumber: string;
  bookingId: string;
  orderId?: string;
  raisedByUserId: string;
  raisedByUserName: string;
  againstUserId: string;
  againstUserName: string;
  reason: string;
  status: 'open' | 'under_review' | 'waiting_response' | 'resolved' | 'rejected' | 'closed';
  resolutionNotes?: string;
  refundAmountEgp?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  accountCode: string; // e.g., '1010-CASH-ESCROW', '2010-CONSULTANT-PAYABLE', '4010-PLATFORM-REVENUE'
  accountName: string;
  debitPiasters: number; // BigInt represented as integer piasters (1 EGP = 100 Piasters)
  creditPiasters: number;
}

export interface LedgerTransaction {
  id: string;
  date: string;
  description: string;
  referenceType: 'booking' | 'payout' | 'refund' | 'dispute_settlement' | 'affiliate_payout';
  referenceId: string;
  idempotencyKey: string;
  entries: LedgerEntry[];
  totalDebitsPiasters: number;
  totalCreditsPiasters: number;
  isBalanced: boolean;
  postedBy: string;
}

export interface Review {
  id: string;
  bookingId: string;
  consultantId: string;
  clientId: string;
  clientName: string;
  rating: number; // 1 to 5
  comment: string;
  verifiedTransaction: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  details: string;
  timestamp: string;
  status: 'success' | 'failure';
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: {
    senderName: string;
    senderRole: 'user' | 'support' | 'admin';
    content: string;
    timestamp: string;
  }[];
  createdAt: string;
}

export interface AffiliateAccount {
  userId: string;
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  confirmedTransactions: number;
  earnedCommissionsEgp: number;
  pendingPayoutsEgp: number;
}

export interface SupportingProduct {
  id: string;
  sku: string;
  titleAr: string;
  titleEn: string;
  category: string;
  priceEgp: number;
  descriptionAr: string;
  downloadAvailable: boolean;
  fileFormat: string;
  rating: number;
}

// ==============================================================================
// CONSULTING SERVICES CATALOG & ORDERS TYPES
// ==============================================================================

export type CatalogDeliveryMode = 'online' | 'in_person' | 'both';

export type CatalogServiceStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'paused'
  | 'rejected'
  | 'suspended';

export type ServiceOrderStatus =
  | 'pending'
  | 'accepted'
  | 'awaiting_payment'
  | 'paid'
  | 'in_progress'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'refunded';

export interface ServiceSubcategory {
  id: string;
  parentId: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
}

export interface ServiceCategoryNode {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  iconName: string;
  requiresLicense: boolean;
  displayOrder: number;
  isActive: boolean;
  subcategories: ServiceSubcategory[];
  serviceCount?: number;
}

export interface ServicePhaseMilestone {
  id: string;
  stepNumber: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  durationDays: number;
}

export interface ServiceFAQ {
  id: string;
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
}

export interface ServicePackageTier {
  id: string;
  nameAr: string;
  nameEn: string;
  priceEgp: number;
  executionDays: number;
  revisionsCount: number;
  featuresAr: string[];
}

export interface CatalogService {
  id: string;
  slug: string;
  consultantId: string;
  providerUserId: string;
  providerName: string;
  providerTitle: string;
  providerAvatar: string;
  providerVerified: boolean;
  categoryId: string;
  categoryNameAr: string;
  categoryNameEn: string;
  subcategoryId: string;
  subcategoryNameAr: string;
  subcategoryNameEn: string;
  titleAr: string;
  titleEn: string;
  shortDescriptionAr: string;
  shortDescriptionEn: string;
  fullDescriptionAr: string;
  fullDescriptionEn: string;
  imageUrl: string;
  priceEgp: number;
  pricePiasters: number;
  executionDays: number;
  deliveryMode: CatalogDeliveryMode;
  revisionsCount: number;
  includedAr: string[];
  excludedAr: string[];
  prerequisitesAr: string[];
  deliverablesAr: string[];
  milestones: ServicePhaseMilestone[];
  faqs: ServiceFAQ[];
  packages?: ServicePackageTier[];
  tags: string[];
  requiresLicense: boolean;
  isFeatured: boolean;
  isRecommended: boolean;
  isDemo: boolean;
  status: CatalogServiceStatus;
  rejectionReason?: string;
  rating: number;
  reviewCount: number;
  ordersCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ServiceReviewItem {
  id: string;
  serviceId: string;
  orderId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface ServiceOrderAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ServiceOrderDeliverable {
  id: string;
  title: string;
  notes: string;
  fileUrl?: string;
  fileName?: string;
  submittedAt: string;
}

export interface ServiceOrderEvent {
  id: string;
  orderId: string;
  fromStatus: ServiceOrderStatus | null;
  toStatus: ServiceOrderStatus;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  note: string;
  createdAt: string;
}

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  serviceId: string;
  serviceTitleAr: string;
  serviceImageUrl: string;
  categoryId: string;
  clientId: string;
  clientName: string;
  consultantId: string;
  providerUserId: string;
  providerName: string;
  deliveryMode: CatalogDeliveryMode;
  packageName?: string;
  clientNotes: string;
  attachments: ServiceOrderAttachment[];
  deliverables: ServiceOrderDeliverable[];
  events: ServiceOrderEvent[];
  priceEgp: number;
  totalPiasters: number;
  platformFeePercent: number;
  platformFeeEgp: number;
  platformFeePiasters: number;
  netProviderEgp: number;
  netProviderPiasters: number;
  status: ServiceOrderStatus;
  paymentMethod?: 'fawry' | 'vodafone_cash' | 'meeza' | 'card_online';
  paymentModeLabel?: string;
  idempotencyKey?: string;
  paidAt?: string;
  executionDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'approval' | 'payment' | 'system';
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ServiceApprovalRecord {
  id: string;
  serviceId: string;
  serviceTitle: string;
  providerName: string;
  adminId: string;
  adminName: string;
  decision: 'approved' | 'rejected' | 'suspended';
  reason: string;
  createdAt: string;
}

