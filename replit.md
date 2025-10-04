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

**Homepage & Navigation Enhancements**
- Tabs restructured from New/Follow/Popular to Explore/New/Follow with profile shuffling on mount
- Random Match floating button added with purple-pink gradient background and pulse animation
- Random Match positioned at mid-bottom of screen for easy thumb access on mobile

**Creator Profile Enhancements**
- Languages display showing comma-separated list (e.g., "English, Hindi, Tamil") with translate icon
- Country badge with India flag icon next to followers count
- Follow button with animated pulse effect when not following, includes "get updates when online" prompt
- Media gallery with 3x2 grid: 5 images and 1 video thumbnail with play icon
- Full-screen image/video dialogs when media is clicked
- Profile action buttons updated to "Say Hello" (outline) and "Talk Now - ₹X/min" (primary with phone icon)

**Follow/Unfollow System**
- Complete follow/unfollow functionality with localStorage persistence (key: "followedCreators")
- Follow state syncs across navigation - persists when visiting creator profile from any tab
- Follow tab dynamically displays followed creators, refreshes from localStorage on tab activation
- Unfollow removes creator from Follow tab immediately
- CreatorProfile uses route params to extract creator ID for proper state management

**Account Section Enhancements**
- Recharge packs redesigned with emoji mascots (🌟💎🚀👑💰) and gradient borders
- Pack labels added: Starter, Popular, Best Value, Premium, Ultimate
- Visual hierarchy with color-coded gradients (yellow→blue→green→purple→gold)
- Settings restructured with Accordion component:
  - Language selection and DND toggle as standalone items
  - Legal & Policies as expandable accordion section containing all policy links
  - Clean, organized interface following mobile app patterns
- Back button added to upper left corner for consistent navigation to home screen
- **Profile Editing System**:
  - User ID displayed in TK-XXXXXXXX format with copy-to-clipboard functionality
  - Edit mode allows updating username, name, and email fields
  - Mobile number is read-only (cannot be edited)
  - Save button commits changes with "Profile Updated" success toast
  - Cancel button discards changes and reverts to original values
  - Copy User ID button shows "User ID Copied" toast confirmation

**Strict PRD Compliance Updates**
- **Test Creator Profiles**: Created 9 comprehensive test profiles with complete data structure:
  - All profiles include: aboutMe, talksAbout (array), hobbies (array), foodPreferences (array), sportsInterests (array)
  - Country and followers count properly set for all profiles
  - Data structure matches production requirements for rich profile displays
- **About Section Implementation**: Added detailed About section to creator profiles displaying:
  - About Me paragraph with person icon
  - Talks About topics as comma-separated list with message icon
  - Hobbies as comma-separated list with heart icon
  - Favorite Food items with utensils icon
  - Sports Interests with trophy icon
  - Section appears before Photos & Videos with proper data-testid attributes for testing
- **Payment Gateway Flow (Strict Mode)**: Complete recharge flow redesign per PRD:
  - Removed all custom amount input fields - only predefined INR packs allowed (₹100, ₹200, ₹500, ₹1000, ₹2000, ₹5000)
  - Payment gateway modal opens immediately after pack selection with no intermediate pages
  - Modal displays three gateways: PayU, Cashfree, Razorpay with icons and descriptions
  - Modal is non-dismissible: prevents outside click and Escape key - user must select gateway or cancel
  - Toast timing adjusted: "Processing Payment" (1.5s) → "Payment Successful!" (1.5s) → redirect to /user/account
  - Enforces strict PRD requirement: no custom recharge amounts allowed
  - Tested and verified: end-to-end payment flow works correctly with proper redirect behavior

**Creator & Agency App - Complete Rebuild (2025-01-04)**
- **Dashboard Enhancements**: 
  - Live status badge with red pulse animation when streaming
  - Enhanced earnings display (today/week/month) with visual stats
  - Quick action cards for Voice Call, Video Call, Streaming, Beauty Filters
  - Recent calls history with earnings breakdown
  - Profile statistics with rank badge and approval status
  
- **Virtual Gifts System**:
  - 6-gift catalog: Heart (₹10/100pts), Rose (₹20/200pts), Diamond (₹50/500pts), Crown (₹100/1000pts), Star (₹200/2000pts), Sparkles (₹500/5000pts)
  - 70% creator revenue share displayed with progress indicator
  - Top gifters leaderboard with crown/medal badges for top 3
  - Gift points system for PK battles and leaderboards
  
- **PK Battle System**:
  - Battle arena with "Find Opponent" functionality
  - Win/Loss record badge display (e.g., "23W - 8L")
  - Battle history cards showing opponent, result (WIN/LOSS), points, gifts, duration
  - Color-coded results: green for wins, red for losses
  - PK Champions leaderboard with win rate percentages
  
- **Live Streaming Controls**:
  - Go Live button with live status indicator (red pulsing dot)
  - Real-time viewer count and duration tracking
  - Live metrics display: viewers, gifts received, stream duration
  - Camera/Microphone/Filters control buttons during stream
  - Stream settings: Beauty Filter toggle, Allow Gifts toggle, Enable Chat toggle
  
- **Beauty Filters & Effects**:
  - Filter selection dialog accessible during live streams
  - 6 filter options: None, Smooth Skin, Brighten, Natural Glow, Rosy Cheeks, Glamour
  - Active filter indicator with badge
  - Real-time filter switching during streams
  
- **Agency Management Dashboard**:
  - Role switcher: toggle between Creator and Agency views
  - Creator roster management with status indicators (online/offline)
  - Commission tracking per creator (20% agency commission model)
  - Team performance metrics: earnings, calls, commission breakdown
  - Recruitment tools for onboarding new creators
  
- **Financial System**:
  - Daily earnings breakdown by source: Calls, Streaming, Gifts, PK Battles
  - Transaction history with timestamps and amounts
  - Withdrawal system with bank account linking
  - Revenue analytics by time period (today/week/month)
  
- **Leaderboards & Rankings**:
  - Top Creators Leaderboard showing top 5 with crown/medal icons for podium positions
  - User's current rank display (e.g., #47) with personalized "You" marker
  - Top Earners Today section with daily revenue leaders
  - Top PK Champions with win/loss records and win rate percentages
  - Discover Creators section with "Challenge to PK" functionality
  - Visual rank indicators: gold crown for #1, silver/bronze medals for #2-3