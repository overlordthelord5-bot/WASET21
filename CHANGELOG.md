# CHANGELOG - WASEET Consulting Marketplace

All notable changes to the WASEET platform are documented in this file.

## [1.0.0] - 2026-11-11

### Added
- **Core Architecture & Types:**
  - Defined complete domain models for Users, RBAC, Categories, Profiles, Credentials, Bookings, Orders, RFQs, Disputes, Double-Entry Ledger, Audit Logs, and Digital Products.
- **Pure Logic Engines & Unit Tests:**
  - Double-Entry Ledger engine with integer piasters, balanced debit/credit validation, and reversing entries (`src/utils/ledger.ts`).
  - Booking conflict resolution and Cairo-timezone slot generation engine (`src/utils/booking.ts`).
  - Unit tests running on Node test runner with 100% pass rate (`src/utils/ledger.test.ts`, `src/utils/booking.test.ts`).
- **Relational Database DDL:**
  - Complete PostgreSQL DDL (`database/schema.sql`) with referential integrity, BIGINT piasters, checks, indexes, and audit logs.
- **Enterprise Express Backend:**
  - Server entry point (`server.ts`) running Express on port 3000 with Vite middleware, health endpoint, and protected server-side Gemini AI proxy with safety guardrails.
- **Visual Identity & UI Design:**
  - Egyptian Modern Light UI with Cairo and Tajawal typography, RTL-first layout, brand tokens (Deep Blue, Teal, Slate).
  - Navigation bar with one-click multi-role demo switcher, search trigger, and notifications.
  - Interactive Hero section with keyword search and category dropdown.
  - Full catalog of 26+ consulting disciplines with search and filter.
  - Consultant Directory with price slider, experience, delivery mode filters, and verified credential badges.
  - Multi-step interactive Booking Modal with live slot selection, Egyptian payment methods simulation, and Escrow guarantee.
  - RFQ marketplace for publishing briefs and receiving competitive proposals.
  - Order Workspace with deliverable uploads, file downloads, revision cycles, and live messaging.
  - Role-specific dashboards for Clients, Consultants, and Platform Admins with general ledger inspection.
  - Help Center with Egyptian consulting FAQs and support ticket simulator.
  - Comprehensive Footer with Egyptian commercial register and tax card disclosures.
