# Village Grace Calendar

## Overview

A church event calendar application for Village Grace that displays events from Google Calendar. The app features a public-facing monthly calendar view and an admin panel for managing database-stored events. Built with a React frontend and Express backend, using PostgreSQL for data persistence and Replit Auth for authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with path aliases (@/, @shared/, @assets/)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints under /api prefix
- **Authentication**: Replit Auth with OpenID Connect, session-based using express-session
- **Session Storage**: PostgreSQL via connect-pg-simple

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: shared/schema.ts (shared between client and server)
- **Migrations**: Drizzle Kit with push command (db:push)

### Key Design Patterns
- **Monorepo Structure**: Client (client/), Server (server/), Shared code (shared/)
- **Type Sharing**: Zod schemas in shared/ used by both frontend and backend
- **API Contract**: Centralized route definitions in shared/routes.ts
- **Storage Interface**: IStorage interface in server/storage.ts abstracts database operations

### Authentication Flow
- Replit Auth integration in server/replit_integrations/auth/
- Protected routes use isAuthenticated middleware
- User sessions stored in PostgreSQL sessions table
- Admin panel (/admin) requires authentication

### Event Sources
- **Database Events**: CRUD operations via API, managed in admin panel
- **Google Calendar Events**: Fetched via iCal URL (read-only, 5-minute cache)
- **Merged View**: Both sources combined for display on public calendar

## External Dependencies

### Database
- PostgreSQL (required, connection via DATABASE_URL environment variable)
- Tables: events, users, sessions

### External Services
- **Google Calendar**: ICS feed integration via GOOGLE_CALENDAR_ICS_URL environment variable
- **Replit Auth**: OpenID Connect provider (ISSUER_URL defaults to https://replit.com/oidc)

### Required Environment Variables
- DATABASE_URL: PostgreSQL connection string
- SESSION_SECRET: Secret for session encryption
- GOOGLE_CALENDAR_ICS_URL: Google Calendar ICS feed URL (optional)
- REPL_ID: Replit environment identifier (auto-set by Replit)

### Key NPM Packages
- drizzle-orm, drizzle-kit: Database ORM and migrations
- node-ical: Parsing Google Calendar ICS feeds
- passport, openid-client: Authentication
- @tanstack/react-query: Frontend data fetching
- shadcn/ui components: Pre-built accessible UI components