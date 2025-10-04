# Talkin Platform

## Overview

Talkin is a voice-calling platform connecting users with creators for paid conversations. The platform operates on a pay-per-minute model in INR (Indian Rupees), featuring three distinct applications:

1. **User App** - Browse creators, initiate voice calls, manage wallet balance
2. **Creator & Agency App** - Manage profiles, track earnings, handle referrals
3. **Admin Dashboard** - Oversee platform operations, approve creators, manage users

The platform emphasizes trust and transparency in financial transactions, with built-in privacy protections and minimum balance requirements for calls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server
- **Wouter** for lightweight client-side routing (not React Router)
- **TanStack Query (React Query)** for server state management and data fetching

**UI Component System**
- **Shadcn/ui** components built on Radix UI primitives (New York style variant)
- **Tailwind CSS** for styling with custom design tokens
- Material Design-inspired system with custom color palette:
  - Primary: Indigo (245 70% 55% light / 245 65% 60% dark)
  - Success: Green for earnings/active status
  - Warning: Amber for pending approvals
  - Accent: Teal for call-related actions
- **Typography**: Inter (UI/data) and Sora (display/headings) from Google Fonts
- Dark/Light theme support with theme provider context

**State Management**
- Query Client for async server state
- React Context for theme management
- Local state with useState/useEffect for UI interactions
- No global state management library (Redux/Zustand)

**Key Design Patterns**
- Component composition with UI primitives from Radix
- Feature-based component organization (pages + shared components)
- Path aliases configured (@/ for client, @shared for shared code)
- Responsive design with mobile-first approach (breakpoint at 768px)

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript running on Node.js
- ESM module system (type: "module" in package.json)
- Custom middleware for request logging and error handling

**Data Layer**
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** via Neon serverless driver with WebSocket support
- Schema-first approach with shared types between client/server
- Database schema defined in `shared/schema.ts` for cross-platform type safety

**API Architecture**
- RESTful API pattern with `/api` prefix convention
- Storage abstraction layer (IStorage interface) for CRUD operations
- Currently implements in-memory storage (MemStorage) for development
- Designed for easy migration to database-backed storage

**Development Setup**
- Separate dev/production modes with environment-based configuration
- Hot module replacement (HMR) in development via Vite middleware
- TypeScript compilation checking without emit (type checking only)
- Build process: Vite for client, esbuild for server bundling

**Authentication & Sessions**
- **OTP-based passwordless authentication** - Mobile number only registration
- **Auto-generated usernames** - System creates random unique usernames (e.g., "SwiftHawk1234")
- **Device-ID fast login** - Instant login for recognized devices without OTP
- Users cannot choose or edit their username
- Email is optional and can be added after registration for notifications only
- Infrastructure for session management via connect-pg-simple (PostgreSQL session store)
- Session-based authentication pattern (not JWT)
- Cookie-based credentials with "include" fetch mode

### External Dependencies

**Core Infrastructure**
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support for real-time capabilities
- **Drizzle Kit**: Database migration tool and schema management

**UI Component Libraries**
- **Radix UI**: Headless accessible component primitives (26+ components)
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Touch-friendly carousel component
- **CMDK**: Command palette/search interface
- **React Hook Form**: Form state management with @hookform/resolvers for validation
- **Zod**: Schema validation (via drizzle-zod integration)
- **date-fns**: Date manipulation and formatting

**Development Tools**
- **Replit-specific plugins**: Runtime error modal, cartographer, dev banner (development only)
- **PostCSS** with Tailwind CSS and Autoprefixer
- **class-variance-authority & clsx**: Dynamic className management
- **nanoid**: Unique ID generation

**Styling & Design**
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Google Fonts**: Inter and Sora font families
- Custom CSS variables for theming in `client/src/index.css`

**Notable Implementation Details**
- Support chat requires users to complete first call before accessing (feature flag in localStorage)
- Minimum balance requirement: 3x per-minute rate (e.g., ₹135 for ₹45/min creator)
- Privacy warnings enforced before call initiation
- Real-time call duration tracking with per-minute billing calculation
- Multi-role architecture (user/creator/agency/admin) with app selector pattern

## Recent Changes (2025-01-04)

**Account Section Implemented**
- Complete account management page at `/user/account` accessible via profile icon in bottom navigation
- Profile section displays username (auto-generated), phone number (mandatory), email (optional), and profile picture with upload capability
- Recharge system with modal displaying 5 recharge packs (₹100 to ₹5000) with bonus incentives
- Talktime transaction history showing all previous recharges with dates and bonus amounts
- Blocked creators management with individual unblock functionality
- Comprehensive Settings section including:
  - Language selection (first item) with 5 language options displayed full-width
  - DND toggle to control promotional calls
  - All legal/policy links (Terms, Privacy, Refund, Community Guidelines, Moderation, Compliance)
  - Report a Problem option
- Support chat button (enabled only after first successful call completion)
- Logout functionality with localStorage cleanup