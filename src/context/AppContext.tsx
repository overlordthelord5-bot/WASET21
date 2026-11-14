import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Category,
  ConsultantProfile,
  ConsultationService,
  AvailabilityRule,
  Booking,
  OrderWorkspaceItem,
  RFQRequest,
  RFQProposal,
  Message,
  Dispute,
  LedgerTransaction,
  Review,
  AuditLog,
  SupportTicket,
  SupportingProduct,
  DeliveryMode,
  AppNotification,
  CatalogService,
} from '../types';
import { catalogFetch } from '../utils/catalogApi';
import {
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_CONSULTANTS,
  INITIAL_SERVICES,
  INITIAL_AVAILABILITY_RULES,
  INITIAL_BOOKINGS,
  INITIAL_ORDERS,
  INITIAL_RFQS,
  INITIAL_REVIEWS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_SUPPORTING_PRODUCTS,
} from '../data/mockData';
import {
  createBookingLedgerTransaction,
  createRefundLedgerTransaction,
  DEFAULT_PLATFORM_COMMISSION_PERCENT,
  DEFAULT_AFFILIATE_COMMISSION_PERCENT,
  CommissionBreakdown,
  calculateCommission,
} from '../utils/ledger';
import { hasBookingConflict } from '../utils/booking';

interface AppContextType {
  // Locale & Language
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  toggleLang: () => void;
  dir: 'rtl' | 'ltr';

  // Active User & Auth
  currentUser: User;
  switchUserRole: (role: UserRole) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  loginUser: (email: string, role?: UserRole) => boolean;
  registerUser: (name: string, email: string, phone: string, role: UserRole) => boolean;

  // Navigation & URL Sync
  activeView: string;
  setActiveView: (view: string) => void;
  selectedServiceId: string | null;
  navigateToService: (serviceId: string) => void;
  navigateToServicesCatalog: (filters?: { providerId?: string; categoryId?: string; q?: string }) => void;
  catalogInitialFilters: { providerId?: string; categoryId?: string; q?: string };
  navigateToConsultantDirectoryWithService: (categoryId?: string, query?: string) => void;
  consultantDirectorySeed: { categoryId?: string; query?: string };

  // Data Collections
  categories: Category[];
  consultants: ConsultantProfile[];
  services: ConsultationService[];
  availabilityRules: AvailabilityRule[];
  bookings: Booking[];
  orders: OrderWorkspaceItem[];
  rfqs: RFQRequest[];
  messages: Message[];
  disputes: Dispute[];
  ledgerTransactions: LedgerTransaction[];
  reviews: Review[];
  auditLogs: AuditLog[];
  supportTickets: SupportTicket[];
  supportingProducts: SupportingProduct[];

  // Catalog Notifications & Order Modal
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  serviceOrderModalService: CatalogService | null;
  setServiceOrderModalService: (srv: CatalogService | null) => void;
  catalogRefreshTick: number;
  triggerCatalogRefresh: () => void;

  // Settings
  platformFeePercent: number;
  setPlatformFeePercent: (percent: number) => void;
  affiliateFeePercent: number;
  setAffiliateFeePercent: (percent: number) => void;

  // Modals & Selection
  selectedConsultant: ConsultantProfile | null;
  setSelectedConsultant: (c: ConsultantProfile | null) => void;
  isBookingModalOpen: boolean;
  setIsBookingModalOpen: (open: boolean) => void;
  bookingPreselectedService: ConsultationService | null;
  setBookingPreselectedService: (s: ConsultationService | null) => void;
  isRFQModalOpen: boolean;
  setIsRFQModalOpen: (open: boolean) => void;
  isAIModalOpen: boolean;
  setIsAIModalOpen: (open: boolean) => void;
  activeOrderWorkspaceId: string | null;
  setActiveOrderWorkspaceId: (id: string | null) => void;

  // Core Actions
  createBooking: (params: {
    consultantId: string;
    serviceId?: string;
    serviceTitle: string;
    categoryId: string;
    scheduledAt: string;
    durationMinutes: number;
    priceEgp: number;
    deliveryMode: DeliveryMode;
    notes: string;
    paymentMethod: 'fawry' | 'vodafone_cash' | 'meeza' | 'card_online';
  }) => { success: boolean; bookingId?: string; error?: string };

  cancelBooking: (bookingId: string, reason: string) => boolean;
  completeBookingAndReleaseEscrow: (bookingId: string) => boolean;

  createRFQ: (params: {
    title: string;
    description: string;
    categoryId: string;
    budgetMinEgp: number;
    budgetMaxEgp: number;
    requiredByDate: string;
  }) => boolean;

  submitRFQProposal: (rfqId: string, priceEgp: number, days: number, note: string) => boolean;
  acceptRFQProposal: (rfqId: string, proposalId: string) => boolean;

  submitDeliverable: (orderId: string, title: string, description: string, fileUrl?: string) => boolean;
  requestOrderRevision: (orderId: string, revisionNote: string) => boolean;

  sendMessage: (conversationId: string, recipientId: string, content: string) => boolean;

  openDispute: (bookingId: string, reason: string) => boolean;
  resolveDispute: (disputeId: string, resolution: 'refund_client' | 'pay_consultant', notes: string) => boolean;

  verifyConsultant: (consultantId: string, approve: boolean, notes?: string) => boolean;

  addAuditLog: (action: string, entityType: string, entityId: string, details: string) => void;
  createSupportTicket: (params: {
    subject: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    message: string;
  }) => boolean;
  replyToSupportTicket: (ticketId: string, content: string) => boolean;
  updateTicketStatus: (ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'WASEET_V1_STATE';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<'ar' | 'en'>('ar');
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Load or fallback to initial data
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_USER');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_USERS[0]; // Client أحمد محمود
  });

  const parseRouteFromLocation = (): { view: string; serviceId: string | null } => {
    if (typeof window === 'undefined') return { view: 'home', serviceId: null };
    const pathname = window.location.pathname || '/';
    if (pathname.startsWith('/services/')) {
      const id = decodeURIComponent(pathname.replace('/services/', '').split('/')[0] || '');
      if (id) return { view: 'service_detail', serviceId: id };
    }
    if (pathname === '/services' || pathname === '/services/') {
      return { view: 'services', serviceId: null };
    }
    return { view: 'home', serviceId: null };
  };

  const initialRoute = parseRouteFromLocation();
  const [activeView, setActiveViewState] = useState<string>(initialRoute.view);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(initialRoute.serviceId);
  const [catalogInitialFilters, setCatalogInitialFilters] = useState<{
    providerId?: string;
    categoryId?: string;
    q?: string;
  }>({});
  const [consultantDirectorySeed, setConsultantDirectorySeed] = useState<{
    categoryId?: string;
    query?: string;
  }>({});
  const [serviceOrderModalService, setServiceOrderModalService] = useState<CatalogService | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [catalogRefreshTick, setCatalogRefreshTick] = useState<number>(0);

  const triggerCatalogRefresh = () => setCatalogRefreshTick((prev) => prev + 1);

  const setActiveView = (view: string) => {
    setActiveViewState(view);
    if (typeof window !== 'undefined') {
      if (view === 'services') {
        setSelectedServiceId(null);
        if (window.location.pathname !== '/services') {
          window.history.pushState({ view: 'services' }, '', '/services');
        }
      } else if (view !== 'service_detail') {
        setSelectedServiceId(null);
        if (window.location.pathname !== '/') {
          window.history.pushState({ view }, '', '/');
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setActiveViewState('service_detail');
    if (typeof window !== 'undefined') {
      const targetPath = `/services/${encodeURIComponent(serviceId)}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view: 'service_detail', serviceId }, '', targetPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToServicesCatalog = (filters?: { providerId?: string; categoryId?: string; q?: string }) => {
    setCatalogInitialFilters(filters || {});
    setSelectedServiceId(null);
    setActiveViewState('services');
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== '/services') {
        window.history.pushState({ view: 'services' }, '', '/services');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToConsultantDirectoryWithService = (categoryId?: string, query?: string) => {
    setConsultantDirectorySeed({ categoryId, query });
    setSelectedServiceId(null);
    setActiveView('consultants');
  };

  useEffect(() => {
    const onPopState = () => {
      const parsed = parseRouteFromLocation();
      setActiveViewState(parsed.view);
      setSelectedServiceId(parsed.serviceId);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [consultants, setConsultants] = useState<ConsultantProfile[]>(INITIAL_CONSULTANTS);
  const [services, setServices] = useState<ConsultationService[]>(INITIAL_SERVICES);
  const [availabilityRules] = useState<AvailabilityRule[]>(INITIAL_AVAILABILITY_RULES);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [orders, setOrders] = useState<OrderWorkspaceItem[]>(INITIAL_ORDERS);
  const [rfqs, setRfqs] = useState<RFQRequest[]>(INITIAL_RFQS);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      conversationId: 'conv-bk-101',
      senderId: 'user-client-1',
      senderName: 'أحمد محمود القاضي',
      senderRole: 'client',
      content: 'أهلاً د. طارق، هل يجب إرسال ملف الإقرارات بصيغة PDF قبل موعد الجلسة؟',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      isRead: true,
    },
    {
      id: 'msg-2',
      conversationId: 'conv-bk-101',
      senderId: 'user-consultant-1',
      senderName: 'د. طارق السعيد العوضي',
      senderRole: 'consultant',
      content: 'أهلاً بك أستاذ أحمد. نعم يفضل إرسال آخر إقرار ضريبي بالإضافة إلى كشف مبيعات الربع الأخير لتسريع التدقيق أثناء الجلسة.',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      isRead: true,
    },
  ]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [ledgerTransactions, setLedgerTransactions] = useState<LedgerTransaction[]>([
    createBookingLedgerTransaction('bk-101', 1800, 15, 'IDEM-INIT-101'),
    createBookingLedgerTransaction('bk-102', 1400, 15, 'IDEM-INIT-102'),
  ]);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [supportingProducts] = useState<SupportingProduct[]>(INITIAL_SUPPORTING_PRODUCTS);

  // Platform commissions
  const [platformFeePercent, setPlatformFeePercent] = useState<number>(DEFAULT_PLATFORM_COMMISSION_PERCENT);
  const [affiliateFeePercent, setAffiliateFeePercent] = useState<number>(DEFAULT_AFFILIATE_COMMISSION_PERCENT);

  // Modals
  const [selectedConsultant, setSelectedConsultant] = useState<ConsultantProfile | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingPreselectedService, setBookingPreselectedService] = useState<ConsultationService | null>(null);
  const [isRFQModalOpen, setIsRFQModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeOrderWorkspaceId, setActiveOrderWorkspaceId] = useState<string | null>(null);

  const refreshNotifications = async () => {
    try {
      const data = await catalogFetch<{ success: boolean; notifications: AppNotification[] }>(
        '/api/notifications',
        {},
        currentUser
      );
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch {
      // silent fallback
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await catalogFetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }, currentUser);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      // ignore
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await catalogFetch('/api/notifications/read-all', { method: 'POST' }, currentUser);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshNotifications();
  }, [currentUser.id, catalogRefreshTick]);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  // Update HTML direction when language changes
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (newLang: 'ar' | 'en') => {
    setLangState(newLang);
  };

  const toggleLang = () => {
    setLangState((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const addAuditLog = (action: string, entityType: string, entityId: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser.id,
      userRole: currentUser.role,
      action,
      entityType,
      entityId,
      ipAddress: '156.204.18.92',
      details,
      timestamp: new Date().toISOString(),
      status: 'success',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const switchUserRole = (role: UserRole) => {
    const targetUser = INITIAL_USERS.find((u) => u.role === role) || {
      id: `user-${role}-test`,
      name: `مستخدم تجريبي (${role})`,
      email: `${role}@waseet.eg`,
      phone: '+201000000000',
      role,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      isVerified: true,
      registeredAt: new Date().toISOString(),
      preferredLanguage: lang,
    };
    setCurrentUser(targetUser);
    localStorage.setItem(LOCAL_STORAGE_KEY + '_USER', JSON.stringify(targetUser));
    addAuditLog('USER_SWITCH_ROLE', 'user', targetUser.id, `تبديل الحساب النشط إلى دور: ${role}`);
  };

  const loginUser = (email: string, role: UserRole = 'client'): boolean => {
    const existing = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setCurrentUser(existing);
      localStorage.setItem(LOCAL_STORAGE_KEY + '_USER', JSON.stringify(existing));
      addAuditLog('USER_LOGIN', 'user', existing.id, `تسجيل دخول ناجح للمستخدم ${existing.name}`);
      setIsAuthModalOpen(false);
      return true;
    }
    // create dynamic user
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email,
      phone: '+201011223344',
      role,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      isVerified: true,
      registeredAt: new Date().toISOString(),
      preferredLanguage: lang,
    };
    setCurrentUser(newUser);
    localStorage.setItem(LOCAL_STORAGE_KEY + '_USER', JSON.stringify(newUser));
    addAuditLog('USER_LOGIN_NEW', 'user', newUser.id, `تسجيل حساب جديد بالبريد ${email}`);
    setIsAuthModalOpen(false);
    return true;
  };

  const registerUser = (name: string, email: string, phone: string, role: UserRole): boolean => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      phone,
      role,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      isVerified: role === 'consultant' ? false : true,
      registeredAt: new Date().toISOString(),
      preferredLanguage: lang,
    };
    setCurrentUser(newUser);
    localStorage.setItem(LOCAL_STORAGE_KEY + '_USER', JSON.stringify(newUser));
    addAuditLog('USER_REGISTER', 'user', newUser.id, `تسجيل مستخدم جديد: ${name} بصلاحية ${role}`);
    setIsAuthModalOpen(false);
    return true;
  };

  // Create Booking
  const createBooking = (params: {
    consultantId: string;
    serviceId?: string;
    serviceTitle: string;
    categoryId: string;
    scheduledAt: string;
    durationMinutes: number;
    priceEgp: number;
    deliveryMode: DeliveryMode;
    notes: string;
    paymentMethod: 'fawry' | 'vodafone_cash' | 'meeza' | 'card_online';
  }): { success: boolean; bookingId?: string; error?: string } => {
    // 1. Conflict Prevention Check
    const conflict = hasBookingConflict(
      params.scheduledAt,
      params.durationMinutes,
      bookings,
      params.consultantId
    );

    if (conflict.hasConflict) {
      return {
        success: false,
        error: 'هذا الموعد محجوز مسبقاً أو يتعارض مع جلسة أخرى للمستشار. يرجى اختيار موعد آخر.',
      };
    }

    const consultant = consultants.find((c) => c.id === params.consultantId);
    if (!consultant) {
      return { success: false, error: 'المستشار المحدد غير موجود' };
    }

    // 2. Commission & Ledger Calculation
    const commission: CommissionBreakdown = calculateCommission(params.priceEgp, platformFeePercent);
    const bookingId = `bk-${Date.now()}`;
    const bookingNumber = `WAS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking: Booking = {
      id: bookingId,
      bookingNumber,
      clientId: currentUser.id,
      clientName: currentUser.name,
      consultantId: consultant.id,
      consultantName: consultant.nameAr,
      serviceId: params.serviceId,
      serviceTitle: params.serviceTitle,
      categoryId: params.categoryId,
      deliveryMode: params.deliveryMode,
      notes: params.notes,
      priceEgp: commission.totalAmountEgp,
      platformFeeEgp: commission.platformFeeEgp,
      netConsultantEgp: commission.netConsultantEgp,
      status: 'confirmed',
      scheduledAt: params.scheduledAt,
      durationMinutes: params.durationMinutes,
      meetingUrl: `https://meet.waseet.eg/room/${bookingNumber}`,
      paymentMethod: params.paymentMethod,
      paymentStatus: 'held_in_escrow',
      isEscrowHeld: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. Post Double-Entry Ledger Entry
    const idempotencyKey = `IDEM-PAY-${bookingId}-${Date.now()}`;
    const ledgerTx = createBookingLedgerTransaction(
      bookingId,
      params.priceEgp,
      platformFeePercent,
      idempotencyKey,
      currentUser.name
    );

    // 4. Create Order Workspace entry
    const newOrder: OrderWorkspaceItem = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-WAS-${Math.floor(500 + Math.random() * 500)}`,
      bookingId,
      clientId: currentUser.id,
      clientName: currentUser.name,
      consultantId: consultant.id,
      consultantName: consultant.nameAr,
      serviceTitle: params.serviceTitle,
      amountEgp: commission.totalAmountEgp,
      platformFeeEgp: commission.platformFeeEgp,
      status: 'active',
      deliverables: [],
      revisionRequests: [],
      maxRevisions: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);
    setOrders((prev) => [newOrder, ...prev]);
    setLedgerTransactions((prev) => [ledgerTx, ...prev]);

    addAuditLog(
      'CREATE_BOOKING',
      'booking',
      bookingId,
      `حجز استشارة #${bookingNumber} مع ${consultant.nameAr} بقيمة ${params.priceEgp} ج.م مع إيداع الضمان`
    );

    return { success: true, bookingId };
  };

  const cancelBooking = (bookingId: string, reason: string): boolean => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return false;

    // Refund ledger reversal
    const origTx = ledgerTransactions.find((tx) => tx.referenceId === bookingId && tx.referenceType === 'booking');
    if (origTx) {
      const refundTx = createRefundLedgerTransaction(
        origTx,
        reason,
        `IDEM-CANCEL-${bookingId}-${Date.now()}`,
        currentUser.name
      );
      setLedgerTransactions((prev) => [refundTx, ...prev]);
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'cancelled',
              cancellationReason: reason,
              paymentStatus: 'refunded_to_client',
              isEscrowHeld: false,
              updatedAt: new Date().toISOString(),
            }
          : b
      )
    );

    addAuditLog('CANCEL_BOOKING', 'booking', bookingId, `إلغاء حجز #${target.bookingNumber} واسترداد المبلغ: ${reason}`);
    return true;
  };

  const completeBookingAndReleaseEscrow = (bookingId: string): boolean => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return false;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'completed',
              paymentStatus: 'released_to_consultant',
              isEscrowHeld: false,
              updatedAt: new Date().toISOString(),
            }
          : b
      )
    );

    setOrders((prev) =>
      prev.map((o) =>
        o.bookingId === bookingId
          ? {
              ...o,
              status: 'completed',
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );

    addAuditLog(
      'RELEASE_ESCROW',
      'booking',
      bookingId,
      `اكتمال الخدمة وتحرير مستحقات المستشار بقيمة ${target.netConsultantEgp} ج.م`
    );
    return true;
  };

  const createRFQ = (params: {
    title: string;
    description: string;
    categoryId: string;
    budgetMinEgp: number;
    budgetMaxEgp: number;
    requiredByDate: string;
  }): boolean => {
    const newRfq: RFQRequest = {
      id: `rfq-${Date.now()}`,
      rfqNumber: `RFQ-EG-${Math.floor(4000 + Math.random() * 1000)}`,
      clientId: currentUser.id,
      clientName: currentUser.name,
      categoryId: params.categoryId,
      title: params.title,
      description: params.description,
      budgetMinEgp: params.budgetMinEgp,
      budgetMaxEgp: params.budgetMaxEgp,
      requiredByDate: params.requiredByDate,
      status: 'open',
      proposals: [],
      createdAt: new Date().toISOString(),
    };
    setRfqs((prev) => [newRfq, ...prev]);
    addAuditLog('CREATE_RFQ', 'rfq', newRfq.id, `نشر طلب استشارة RFQ #${newRfq.rfqNumber}: ${params.title}`);
    return true;
  };

  const submitRFQProposal = (rfqId: string, priceEgp: number, days: number, note: string): boolean => {
    const consultant = consultants.find((c) => c.userId === currentUser.id) || consultants[0];
    const newProp: RFQProposal = {
      id: `prop-${Date.now()}`,
      rfqId,
      consultantId: consultant.id,
      consultantName: consultant.nameAr,
      consultantAvatar: consultant.avatar,
      consultantRating: consultant.rating,
      proposedPriceEgp: priceEgp,
      executionDays: days,
      coverNote: note,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };

    setRfqs((prev) =>
      prev.map((r) => (r.id === rfqId ? { ...r, proposals: [...r.proposals, newProp] } : r))
    );
    addAuditLog('SUBMIT_PROPOSAL', 'rfq', rfqId, `تقديم عرض سعر بقيمة ${priceEgp} ج.م للطلب`);
    return true;
  };

  const acceptRFQProposal = (rfqId: string, proposalId: string): boolean => {
    const targetRfq = rfqs.find((r) => r.id === rfqId);
    if (!targetRfq) return false;
    const targetProp = targetRfq.proposals.find((p) => p.id === proposalId);
    if (!targetProp) return false;

    const bookingId = `bk-rfq-${Date.now()}`;
    const bookingNumber = `WAS-RFQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const platformFee = Math.round(targetProp.proposedPriceEgp * (platformFeePercent / 100));
    const netConsultant = targetProp.proposedPriceEgp - platformFee;

    const newBooking: Booking = {
      id: bookingId,
      bookingNumber,
      clientId: targetRfq.clientId,
      clientName: targetRfq.clientName,
      consultantId: targetProp.consultantId,
      consultantName: targetProp.consultantName,
      serviceTitle: targetRfq.title,
      categoryId: targetRfq.categoryId,
      deliveryMode: 'video',
      notes: `مشروع ناتج عن طلب عروض أسعار RFQ: ${targetRfq.title}`,
      priceEgp: targetProp.proposedPriceEgp,
      platformFeeEgp: platformFee,
      netConsultantEgp: netConsultant,
      status: 'confirmed',
      scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      durationMinutes: 60,
      meetingUrl: `https://meet.waseet.eg/room/${bookingNumber}`,
      paymentMethod: 'card_online',
      paymentStatus: 'held_in_escrow',
      isEscrowHeld: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const orderId = `ord-${Date.now()}`;
    const orderNumber = `ORD-RFQ-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: OrderWorkspaceItem = {
      id: orderId,
      orderNumber,
      bookingId,
      clientId: targetRfq.clientId,
      clientName: targetRfq.clientName,
      consultantId: targetProp.consultantId,
      consultantName: targetProp.consultantName,
      serviceTitle: targetRfq.title,
      amountEgp: targetProp.proposedPriceEgp,
      platformFeeEgp: platformFee,
      status: 'active',
      deliverables: [],
      revisionRequests: [],
      maxRevisions: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ledgerTx = createBookingLedgerTransaction(
      bookingId,
      targetProp.proposedPriceEgp,
      platformFeePercent,
      `IDEM-RFQ-${bookingId}-${Date.now()}`,
      targetRfq.clientName
    );

    setRfqs((prev) =>
      prev.map((r) => {
        if (r.id !== rfqId) return r;
        return {
          ...r,
          status: 'awarded',
          proposals: r.proposals.map((p) =>
            p.id === proposalId ? { ...p, status: 'accepted' } : { ...p, status: 'rejected' }
          ),
        };
      })
    );

    setBookings((prev) => [newBooking, ...prev]);
    setOrders((prev) => [newOrder, ...prev]);
    setLedgerTransactions((prev) => [ledgerTx, ...prev]);
    setActiveOrderWorkspaceId(orderId);
    setActiveView('workspace');

    addAuditLog(
      'ACCEPT_PROPOSAL',
      'rfq',
      rfqId,
      `قبول عرض المستشار ${targetProp.consultantName} بقيمة ${targetProp.proposedPriceEgp} ج.م مع حجز الضمان وبدء مساحة العمل #${orderNumber}`
    );
    return true;
  };

  const submitDeliverable = (orderId: string, title: string, description: string, fileUrl?: string): boolean => {
    const newDel = {
      id: `del-${Date.now()}`,
      title,
      description,
      fileUrl: fileUrl || 'https://waseet.eg/vault/deliverables/Report_Final_V1.pdf',
      submittedAt: new Date().toISOString(),
    };

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'deliverable_submitted',
              deliverables: [...o.deliverables, newDel],
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );
    addAuditLog('SUBMIT_DELIVERABLE', 'order', orderId, `تسليم مخرج عمل: ${title}`);
    return true;
  };

  const requestOrderRevision = (orderId: string, revisionNote: string): boolean => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'revision_requested',
              revisionRequests: [...o.revisionRequests, revisionNote],
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );
    addAuditLog('REQUEST_REVISION', 'order', orderId, `طلب تعديل على المخرج: ${revisionNote}`);
    return true;
  };

  const sendMessage = (conversationId: string, recipientId: string, content: string): boolean => {
    if (!content.trim()) return false;
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    return true;
  };

  const openDispute = (bookingId: string, reason: string): boolean => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return false;

    const newDispute: Dispute = {
      id: `dsp-${Date.now()}`,
      disputeNumber: `DSP-${Math.floor(100 + Math.random() * 900)}`,
      bookingId,
      raisedByUserId: currentUser.id,
      raisedByUserName: currentUser.name,
      againstUserId: booking.consultantId,
      againstUserName: booking.consultantName,
      reason,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDisputes((prev) => [newDispute, ...prev]);
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'disputed', updatedAt: new Date().toISOString() } : b))
    );

    addAuditLog('OPEN_DISPUTE', 'dispute', newDispute.id, `فتح نزاع على الحجز #${booking.bookingNumber}: ${reason}`);
    return true;
  };

  const resolveDispute = (
    disputeId: string,
    resolution: 'refund_client' | 'pay_consultant',
    notes: string
  ): boolean => {
    const targetDispute = disputes.find((d) => d.id === disputeId);
    if (!targetDispute) return false;

    if (resolution === 'refund_client') {
      cancelBooking(targetDispute.bookingId, `تسوية النزاع لصالح العميل: ${notes}`);
    } else {
      completeBookingAndReleaseEscrow(targetDispute.bookingId);
    }

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              status: 'resolved',
              resolutionNotes: notes,
              updatedAt: new Date().toISOString(),
            }
          : d
      )
    );

    addAuditLog('RESOLVE_DISPUTE', 'dispute', disputeId, `تسوية النزاع #${targetDispute.disputeNumber}: ${resolution}`);
    return true;
  };

  const verifyConsultant = (consultantId: string, approve: boolean, notes?: string): boolean => {
    setConsultants((prev) =>
      prev.map((c) =>
        c.id === consultantId
          ? {
              ...c,
              verificationStatus: approve ? 'verified' : 'rejected',
              verificationNotes: notes,
            }
          : c
      )
    );
    addAuditLog(
      approve ? 'APPROVE_CONSULTANT' : 'REJECT_CONSULTANT',
      'consultant',
      consultantId,
      `قرار اعتماد المستشار: ${approve ? 'معتمد' : 'مرفوض'} - ${notes || ''}`
    );
    return true;
  };

  const createSupportTicket = (params: {
    subject: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    message: string;
  }): boolean => {
    const newTicket: SupportTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: `TKT-WAS-${Math.floor(5000 + Math.random() * 5000)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      subject: params.subject,
      category: params.category,
      priority: params.priority,
      status: 'open',
      createdAt: new Date().toISOString(),
      messages: [
        {
          senderName: currentUser.name,
          senderRole: currentUser.role === 'admin' ? 'admin' : 'user',
          content: params.message,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setSupportTickets((prev) => [newTicket, ...prev]);
    addAuditLog('CREATE_SUPPORT_TICKET', 'support_ticket', newTicket.id, `فتح تذكرة دعم فني: ${params.subject}`);
    return true;
  };

  const replyToSupportTicket = (ticketId: string, content: string): boolean => {
    if (!content.trim()) return false;
    const isSupportOrAdmin = currentUser.role === 'admin' || currentUser.role === 'support';
    setSupportTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          status: isSupportOrAdmin ? 'in_progress' : t.status,
          messages: [
            ...t.messages,
            {
              senderName: currentUser.name,
              senderRole: isSupportOrAdmin ? 'support' : 'user',
              content: content.trim(),
              timestamp: new Date().toISOString(),
            },
          ],
        };
      })
    );
    addAuditLog('REPLY_SUPPORT_TICKET', 'support_ticket', ticketId, `إضافة رد على تذكرة الدعم الفني #${ticketId}`);
    return true;
  };

  const updateTicketStatus = (ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed'): boolean => {
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status } : t))
    );
    addAuditLog('UPDATE_TICKET_STATUS', 'support_ticket', ticketId, `تحديث حالة تذكرة الدعم إلى ${status}`);
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        dir,
        currentUser,
        switchUserRole,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMode,
        setAuthMode,
        loginUser,
        registerUser,
        activeView,
        setActiveView,
        selectedServiceId,
        navigateToService,
        navigateToServicesCatalog,
        catalogInitialFilters,
        navigateToConsultantDirectoryWithService,
        consultantDirectorySeed,
        categories,
        consultants,
        services,
        availabilityRules,
        bookings,
        orders,
        rfqs,
        messages,
        disputes,
        ledgerTransactions,
        reviews,
        auditLogs,
        supportTickets,
        supportingProducts,
        notifications,
        unreadNotificationsCount,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        serviceOrderModalService,
        setServiceOrderModalService,
        catalogRefreshTick,
        triggerCatalogRefresh,
        platformFeePercent,
        setPlatformFeePercent,
        affiliateFeePercent,
        setAffiliateFeePercent,
        selectedConsultant,
        setSelectedConsultant,
        isBookingModalOpen,
        setIsBookingModalOpen,
        bookingPreselectedService,
        setBookingPreselectedService,
        isRFQModalOpen,
        setIsRFQModalOpen,
        isAIModalOpen,
        setIsAIModalOpen,
        activeOrderWorkspaceId,
        setActiveOrderWorkspaceId,
        createBooking,
        cancelBooking,
        completeBookingAndReleaseEscrow,
        createRFQ,
        submitRFQProposal,
        acceptRFQProposal,
        submitDeliverable,
        requestOrderRevision,
        sendMessage,
        openDispute,
        resolveDispute,
        verifyConsultant,
        addAuditLog,
        createSupportTicket,
        replyToSupportTicket,
        updateTicketStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
