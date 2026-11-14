-- ==============================================================================
-- Migration 001 DOWN: Rollback Consulting Services Catalog Tables
-- ==============================================================================

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS service_deliverables CASCADE;
DROP TABLE IF EXISTS service_approvals CASCADE;
DROP TABLE IF EXISTS service_favorites CASCADE;
DROP TABLE IF EXISTS service_reviews CASCADE;
DROP TABLE IF EXISTS service_order_events CASCADE;
DROP TABLE IF EXISTS service_order_files CASCADE;
DROP TABLE IF EXISTS service_orders CASCADE;
DROP TABLE IF EXISTS service_packages CASCADE;
DROP TABLE IF EXISTS service_requirements CASCADE;
DROP TABLE IF EXISTS service_media CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;
