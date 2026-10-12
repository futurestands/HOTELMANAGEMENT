# Hotel Management System — Starter

A responsive, multi-tenant hotel management system foundation.

## Stack
- React + TypeScript + Vite
- Supabase / PostgreSQL
- Responsive CSS
- Role-based access control
- Multi-tenant data model
- Database migrations

## Current foundation
- Hotel/tenant model
- User profiles
- Roles and permissions
- Hotel membership
- Room types and rooms
- Initial dashboard shell
- Supabase client configuration
- SQL migration for the core security model

## Run locally

1. Install Node.js LTS.
2. Run:
   `npm install`
3. Copy `.env.example` to `.env.local`.
4. Add your Supabase URL and publishable/anon key.
5. Run:
   `npm run dev`

## Supabase
Run `supabase/migrations/001_core_schema.sql` in the Supabase SQL editor for the first prototype.

Do not put the Supabase service-role key in the frontend.

## Planned next modules
1. Reservations and room availability
2. Guest management
3. Check-in/check-out
4. Cashier, billing and receipts
5. Inventory and restaurant
6. HR and leave
7. Approval workflows
8. Audit logs
9. Offline/local mode and synchronization
10. Owner reporting
