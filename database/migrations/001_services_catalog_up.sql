-- ==============================================================================
-- Migration 001 UP: Consulting Services Catalog & Service Orders (12 Tables + Notifications)
-- Target: PostgreSQL 15+ | Currency: Egyptian Piasters (BIGINT) | TZ: Africa/Cairo
-- ==============================================================================

CREATE TABLE IF NOT EXISTS service_categories (
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

CREATE INDEX IF NOT EXISTS idx_service_categories_parent ON service_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_active ON service_categories(is_active, display_order);

CREATE TABLE IF NOT EXISTS services (
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

CREATE INDEX IF NOT EXISTS idx_services_consultant ON services(consultant_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id, subcategory_id);
CREATE INDEX IF NOT EXISTS idx_services_status_price ON services(status, price_piasters);

CREATE TABLE IF NOT EXISTS service_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'document')),
  url TEXT NOT NULL,
  alt_text VARCHAR(200),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_media_service ON service_media(service_id);

CREATE TABLE IF NOT EXISTS service_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  requirement_ar TEXT NOT NULL,
  requirement_en TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS service_packages (
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

CREATE TABLE IF NOT EXISTS service_orders (
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

CREATE INDEX IF NOT EXISTS idx_service_orders_client ON service_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_consultant ON service_orders(consultant_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);

CREATE TABLE IF NOT EXISTS service_order_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes INT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880),
  storage_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,
  actor_id UUID NOT NULL REFERENCES users(id),
  actor_role VARCHAR(30) NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_order_events_order ON service_order_events(order_id, created_at);

CREATE TABLE IF NOT EXISTS service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  order_id UUID UNIQUE NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_reviews_service ON service_reviews(service_id);

CREATE TABLE IF NOT EXISTS service_favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, service_id)
);

CREATE TABLE IF NOT EXISTS service_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id),
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected', 'suspended')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  notes TEXT NOT NULL,
  file_url TEXT,
  file_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'order',
  link_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
