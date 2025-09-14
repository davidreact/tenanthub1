I have analyzed the project structure for this property management system. Here's a comprehensive overview:

## Project Overview
This is a **Next.js 15** property management application built with TypeScript, featuring a comprehensive admin-tenant system with Supabase backend integration.

## Key Technologies
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Payments**: Stripe integration
- **Development**: Tempo devtools for development workflow

## Directory Structure

### Root Configuration
- Standard Next.js/TypeScript configuration files
- Tailwind CSS setup with custom theming
- Package.json shows extensive UI component library using Radix UI primitives

### Source Code (`src/`)
- **`app/`**: Next.js App Router structure with:
  - Authentication pages (sign-in, sign-up, forgot-password)
  - Admin dashboard with property, tenant, payment, inventory management
  - Tenant portal for handovers, payments, messages
  - Profile and dashboard areas
- **`components/`**: Reusable UI components including shadcn/ui library
- **`contexts/`**: Language context for internationalization
- **`lib/`**: Utility functions and i18n configuration
- **`types/`**: TypeScript type definitions
- **`utils/`**: Authentication and utility functions

### Supabase Integration (`supabase/`)
- Client and server configuration files
- Database migrations for property management schema
- Authentication middleware setup

## Key Features Identified
1. **Multi-role System**: Separate admin and tenant interfaces
2. **Property Management**: Complete property lifecycle management
3. **Payment Processing**: Integrated Stripe payments
4. **Communication System**: Messaging between admins and tenants
5. **Inventory Management**: Track property inventory and handovers
6. **Internationalization**: Multi-language support
7. **Modern UI**: Responsive design with comprehensive component library

This is a production-ready, full-stack property management solution with enterprise-level features for real estate management companies.