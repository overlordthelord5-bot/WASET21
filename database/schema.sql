-- ==============================================================================
-- WASEET (وسيط) - B2C Consulting Marketplace Database Schema
-- Target: PostgreSQL 15+ / Cloud SQL
-- Currency convention: Stored in Egyptian Piasters as BIGINT (1 EGP = 100 Piasters)
-- Timezone: Africa/Cairo
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USERS & AUTHENTICATION
CREATE TYPE user_role_enum AS ENUM (
  'client',
  'consultant',
  'seller',
  'affiliate',
  'partner',
  'support',
  'admin'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  username VARCHAR(60) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_egypt VARCHAR(20) NOT NULL, -- e.g. +2010... or 010...
  password_hash VARCHAR(255) NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  preferred_language VARCHAR(5) DEFAULT 'ar',
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES & SPECIALTIES (26+ disciplines)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name_ar VARCHAR(150) NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  icon_name VARCHAR(60) NOT NULL,
  image_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);

-- 4. CONSULTANT PROFILES & CREDENTIALS
CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'rejected');

CREATE TABLE consultant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_ar VARCHAR(200) NOT NULL,
  title_en VARCHAR(200),
  bio_ar TEXT NOT NULL,
  bio_en TEXT,
  years_experience INT NOT NULL DEFAULT 1 CHECK (years_experience >= 0),
  session_rate_piasters BIGINT NOT NULL CHECK (session_rate_piasters > 0), -- e.g. 1000 EGP = 100000 piasters
  session_duration_minutes INT NOT NULL DEFAULT 45,
  verification_status verification_status_enum NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  verification_notes TEXT,
  rating_average NUMERIC(3,2) DEFAULT 5.00,
  review_count INT DEFAULT 0,
  city VARCHAR(100) DEFAULT 'القاهرة',
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE consultant_category_mappings (
  consultant_id UUID NOT NULL REFERENCES consultant_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (consultant_id, category_id)
);

CREATE TABLE consultant_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES consultant_profiles(id) ON DELETE CASCADE,
  credential_type VARCHAR(50) NOT NULL, -- 'degree', 'license', 'certification'
  title VARCHAR(200) NOT NULL,
  issuer VARCHAR(200) NOT NULL,
  license_number VARCHAR(100),
  document_storage_path TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CONSULTATION SERVICES (Packaged services)
CREATE TABLE consultation_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES consultant_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  title_ar VARCHAR(200) NOT NULL,
  title_en VARCHAR(200),
  description_ar TEXT NOT NULL,
  price_piasters BIGINT NOT NULL CHECK (price_piasters > 0),
  duration_minutes INT NOT NULL DEFAULT 45,
  delivery_mode VARCHAR(30) NOT NULL DEFAULT 'video', -- video, audio, chat, written, in_person
  deliverables JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(30) NOT NULL DEFAULT 'published', -- draft, pending_review, published, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AVAILABILITY RULES & CALENDAR
CREATE TABLE availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES consultant_profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_duration_minutes INT NOT NULL DEFAULT 45,
  buffer_minutes INT NOT NULL DEFAULT 15,
  advance_notice_hours INT NOT NULL DEFAULT 2,
  future_window_days INT NOT NULL DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT check_times CHECK (end_time > start_time)
);

CREATE TABLE availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES consultant_profiles(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  reason VARCHAR(200),
  is_unavailable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BOOKINGS & SESSIONS
CREATE TYPE booking_status_enum AS ENUM (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
  'disputed'
);

CREATE TYPE payment_status_enum AS ENUM (
  'unpaid',
  'held_in_escrow',
  'released_to_consultant',
  'refunded_to_client'
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number VARCHAR(30) UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES users(id),
  consultant_id UUID NOT NULL REFERENCES consultant_profiles(id),
  service_id UUID REFERENCES consultation_services(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  delivery_mode VARCHAR(30) NOT NULL DEFAULT 'video',
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 45,
  meeting_url TEXT,
  price_piasters BIGINT NOT NULL,
  platform_fee_piasters BIGINT NOT NULL,
  net_consultant_piasters BIGINT NOT NULL,
  status booking_status_enum NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'card_online',
  payment_status payment_status_enum NOT NULL DEFAULT 'unpaid',
  is_escrow_held BOOLEAN DEFAULT FALSE,
  idempotency_key VARCHAR(100) UNIQUE,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_booking_math CHECK (price_piasters = platform_fee_piasters + net_consultant_piasters)
);

CREATE INDEX idx_bookings_consultant_date ON bookings(consultant_id, scheduled_at);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- 8. ORDERS & DELIVERABLE WORKSPACE
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(30) UNIQUE NOT NULL,
  booking_id UUID NOT NULL REFERENCES bookings(id),
  client_id UUID NOT NULL REFERENCES users(id),
  consultant_id UUID NOT NULL REFERENCES consultant_profiles(id),
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  deliverables JSONB DEFAULT '[]'::jsonb,
  revision_count INT DEFAULT 0,
  max_revisions INT DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. RFQ (REQUEST FOR QUOTES)
CREATE TABLE rfq_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number VARCHAR(30) UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES users(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  budget_min_piasters BIGINT NOT NULL,
  budget_max_piasters BIGINT NOT NULL,
  required_by_date DATE NOT NULL,
  status VARCHAR(30) DEFAULT 'open', -- open, awarded, closed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rfq_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES rfq_requests(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL REFERENCES consultant_profiles(id),
  proposed_price_piasters BIGINT NOT NULL,
  execution_days INT NOT NULL,
  cover_note TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'submitted', -- submitted, accepted, rejected, withdrawn
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. MESSAGES & CONVERSATIONS
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  rfq_id UUID REFERENCES rfq_requests(id),
  participant_one_id UUID NOT NULL REFERENCES users(id),
  participant_two_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. DOUBLE-ENTRY ACCOUNTING LEDGER
CREATE TABLE ledger_accounts (
  account_code VARCHAR(50) PRIMARY KEY,
  account_name VARCHAR(150) NOT NULL,
  account_type VARCHAR(30) NOT NULL, -- Asset, Liability, Equity, Revenue, Expense
  description TEXT
);

INSERT INTO ledger_accounts (account_code, account_name, account_type, description) VALUES
('1010-ESCROW-FUNDS', 'حساب أموال الضمان المجمعة (Escrow Funds)', 'Asset', 'الأموال المحصلة من العملاء والمحفوظة تحت الضمان'),
('1020-BANK-OPERATING', 'الحساب البنكي التشغيلي لمنصة وسيط', 'Asset', 'الحساب البنكي للعمليات اليومية'),
('2010-CONSULTANT-ESCROW-PAYABLE', 'مستحقات المستشار المعلقة تحت الضمان', 'Liability', 'مستحقات الاستشاري لحين إتمام الجلسة واعتمادها'),
('2020-CONSULTANT-CLEARED-PAYABLE', 'مستحقات المستشارين الجاهزة للصرف', 'Liability', 'أرصدة متاحة لطلب السحب'),
('4010-PLATFORM-COMMISSION-EARNED', 'إيرادات عمولة وساطة منصة وسيط', 'Revenue', 'عمولة المنصة 15% المحققة'),
('5010-AFFILIATE-EXPENSE', 'مصروفات عمولات المسوقين والإحالات', 'Expense', 'عمولات التسويق بالعمولة 8%')
ON CONFLICT (account_code) DO NOTHING;

CREATE TABLE ledger_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_code VARCHAR(60) UNIQUE NOT NULL,
  reference_type VARCHAR(50) NOT NULL, -- booking, payout, refund, dispute
  reference_id VARCHAR(100) NOT NULL,
  idempotency_key VARCHAR(120) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  is_balanced BOOLEAN NOT NULL DEFAULT TRUE,
  posted_by VARCHAR(100) NOT NULL,
  posted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE CASCADE,
  account_code VARCHAR(50) NOT NULL REFERENCES ledger_accounts(account_code),
  debit_piasters BIGINT NOT NULL DEFAULT 0 CHECK (debit_piasters >= 0),
  credit_piasters BIGINT NOT NULL DEFAULT 0 CHECK (credit_piasters >= 0),
  CONSTRAINT check_debit_or_credit CHECK (
    (debit_piasters > 0 AND credit_piasters = 0) OR
    (credit_piasters > 0 AND debit_piasters = 0)
  )
);

-- 12. DISPUTES & RESOLUTIONS
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_number VARCHAR(30) UNIQUE NOT NULL,
  booking_id UUID NOT NULL REFERENCES bookings(id),
  raised_by UUID NOT NULL REFERENCES users(id),
  against_user UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'open', -- open, under_review, waiting_response, resolved, rejected, closed
  resolution_notes TEXT,
  refund_piasters BIGINT DEFAULT 0,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  user_role VARCHAR(30),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45),
  details JSONB,
  status VARCHAR(20) DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);

-- ==============================================================================
-- 14. CONSULTING SERVICES CATALOG & ORDERS (Migration 001)
-- ==============================================================================
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
  slug VARCHAR(120) UNIQUE NOT NULL,
  name_ar VARCHAR(160) NOT NULL,
  name_en VARCHAR(160) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  icon_name VARCHAR(60) NOT NULL DEFAULT 'Briefcase',
  requires_license BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(180) UNIQUE NOT NULL,
  consultant_id UUID NOT NULL REFERENCES consultant_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES service_categories(id),
  subcategory_id UUID REFERENCES service_categories(id),
  title_ar VARCHAR(220) NOT NULL,
  title_en VARCHAR(220) NOT NULL,
  short_description_ar TEXT NOT NULL,
  short_description_en TEXT,
  full_description_ar TEXT NOT NULL,
  full_description_en TEXT,
  price_piasters BIGINT NOT NULL CHECK (price_piasters > 0),
  execution_days INT NOT NULL DEFAULT 3 CHECK (execution_days > 0),
  delivery_mode VARCHAR(20) NOT NULL CHECK (delivery_mode IN ('online', 'in_person', 'both')),
  revisions_count INT NOT NULL DEFAULT 2 CHECK (revisions_count >= 0),
  included_scope JSONB NOT NULL DEFAULT '[]'::jsonb,
  excluded_scope JSONB NOT NULL DEFAULT '[]'::jsonb,
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  requires_license BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL DEFAULT 'pending_review' CHECK (
    status IN ('draft', 'pending_review', 'published', 'paused', 'rejected', 'suspended')
  ),
  rejection_reason TEXT,
  rating_average NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  review_count INT NOT NULL DEFAULT 0,
  orders_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE service_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'document')),
  url TEXT NOT NULL,
  alt_text VARCHAR(200),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE service_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  requirement_ar TEXT NOT NULL,
  requirement_en TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name_ar VARCHAR(120) NOT NULL,
  name_en VARCHAR(120),
  price_piasters BIGINT NOT NULL CHECK (price_piasters > 0),
  execution_days INT NOT NULL CHECK (execution_days > 0),
  revisions_count INT NOT NULL DEFAULT 1,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(40) UNIQUE NOT NULL,
  service_id UUID NOT NULL REFERENCES services(id),
  client_id UUID NOT NULL REFERENCES users(id),
  consultant_id UUID NOT NULL REFERENCES consultant_profiles(id),
  package_id UUID REFERENCES service_packages(id),
  delivery_mode VARCHAR(20) NOT NULL CHECK (delivery_mode IN ('online', 'in_person', 'both')),
  client_notes TEXT NOT NULL,
  total_piasters BIGINT NOT NULL CHECK (total_piasters > 0),
  platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  platform_fee_piasters BIGINT NOT NULL CHECK (platform_fee_piasters >= 0),
  net_provider_piasters BIGINT NOT NULL CHECK (net_provider_piasters >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending', 'accepted', 'awaiting_payment', 'paid',
      'in_progress', 'delivered', 'completed', 'cancelled', 'disputed', 'refunded'
    )
  ),
  payment_method VARCHAR(30),
  payment_mode_label VARCHAR(120),
  idempotency_key VARCHAR(120) UNIQUE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT check_service_order_math CHECK (total_piasters = platform_fee_piasters + net_provider_piasters)
);

CREATE TABLE service_order_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes INT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880),
  storage_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE service_order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,
  actor_id UUID NOT NULL REFERENCES users(id),
  actor_role VARCHAR(30) NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  order_id UUID UNIQUE NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE service_favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, service_id)
);

CREATE TABLE service_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id),
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected', 'suspended')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE service_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  notes TEXT NOT NULL,
  file_url TEXT,
  file_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'order',
  link_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

