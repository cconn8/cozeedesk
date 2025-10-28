# Cozeedesk System Architecture Overview

  System Design

  Cozeedesk is a multi-tenant case management system with AI-powered document extraction. Here's how everything works together:

  Architecture Overview

  - Backend: NestJS (TypeScript) on port 3005
  - Frontend: Next.js 15 with React 19
  - Database: Multi-tenant MongoDB setup
  - Storage: Google Cloud Storage
  - AI: Anthropic Claude Sonnet 4.5 for document extraction
  - Queue: Redis + Bull for background processing
  - Real-time: WebSocket notifications

  Core Data Flow

  User Upload → GCS Storage → Queue Job → AI Processing → Verification UI → Active Case

  Key Components

  1. Multi-Tenant Authentication
  - JWT-based auth with tenant context
  - Single/multi-tenant login flow
  - Secure tenant data isolation

  2. Document Processing Pipeline
  - PDF/Image upload → Enhancement → Claude AI extraction
  - Template-aware extraction (strict/flexible modes)
  - Multi-page document merging
  - Confidence scoring and error handling

  3. Case Management Workflow
  - Manual case creation OR AI-assisted via document upload
  - Status flow: processing → pending_verification → active
  - Real-time status updates via WebSocket

  4. Real-time Notifications
  - WebSocket gateway with tenant-based rooms
  - Extraction progress and completion notifications
  - Auto-updates in frontend UI