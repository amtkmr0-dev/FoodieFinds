# Talkin Platform - Design Guidelines

## Design Approach: Material Design System (Customized)

**Rationale:** This platform requires trust, clarity, and efficiency across financial transactions, real-time voice calls, and data-heavy dashboards. Material Design provides the structured foundation needed while allowing customization for the unique social-communication aspects.

**Key Design Principles:**
- **Clarity First:** Financial and call data must be immediately comprehensible
- **Trust Signals:** Professional appearance that instills confidence in monetary transactions
- **Efficient Hierarchy:** Quick scanning for users browsing creators, agencies managing earnings
- **Platform Consistency:** Unified experience across mobile apps and web dashboard

---

## Core Design Elements

### A. Color Palette

**Primary Colors:**
- **Brand Primary (Indigo):** 245 70% 55% (Light Mode) | 245 65% 60% (Dark Mode)
- **Success (Green):** 142 70% 45% (Light) | 142 65% 50% (Dark) - for active status, earnings
- **Warning (Amber):** 38 90% 50% (Light) | 38 85% 55% (Dark) - for pending approvals

**Neutral Scale:**
- **Light Mode Backgrounds:** 0 0% 98% (base), 0 0% 100% (cards)
- **Dark Mode Backgrounds:** 240 10% 8% (base), 240 8% 12% (cards)
- **Text Primary:** 240 15% 15% (Light) | 0 0% 95% (Dark)
- **Text Secondary:** 240 8% 45% (Light) | 240 5% 65% (Dark)

**Accent (Use Sparingly):**
- **Call Accent (Teal):** 180 65% 45% (Light) | 180 60% 50% (Dark) - for call buttons, active calls

### B. Typography

**Font Family:**
- **Primary:** Inter (Google Fonts) - for UI, data, forms
- **Display:** Sora (Google Fonts) - for hero sections, large headings

**Type Scale:**
- **Display Large:** 48px/56px, Sora SemiBold - Dashboard headers
- **Heading 1:** 32px/40px, Sora SemiBold - Page titles
- **Heading 2:** 24px/32px, Inter SemiBold - Section headers
- **Heading 3:** 20px/28px, Inter SemiBold - Card titles
- **Body Large:** 16px/24px, Inter Regular - Primary content
- **Body:** 14px/20px, Inter Regular - Standard text
- **Caption:** 12px/16px, Inter Medium - Labels, metadata

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- **Micro spacing:** p-2, gap-2 (within components)
- **Component spacing:** p-4, gap-4 (between related elements)
- **Section spacing:** p-6, py-8 (mobile), py-12, py-16 (desktop)
- **Major breaks:** py-16, py-20, py-24 (between major sections)

**Grid System:**
- **Mobile:** Single column, max-w-full with px-4 padding
- **Tablet:** 2-column grid for cards (md:grid-cols-2)
- **Desktop:** 3-4 column grids (lg:grid-cols-3, xl:grid-cols-4)
- **Container Max-Width:** max-w-7xl for dashboard, max-w-md for mobile apps

**Responsive Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px  
- Desktop: > 1024px

---

## Component Library

### D. Core UI Elements

**Cards (Creator Profiles, Stats):**
- Background: White (Light) / 240 8% 12% (Dark)
- Border: 1px solid 240 10% 90% (Light) / 240 8% 18% (Dark)
- Border Radius: rounded-xl (12px)
- Padding: p-4 (mobile), p-6 (desktop)
- Shadow: subtle elevation on hover (shadow-md)
- Clickable cards: Full card is tap target, scale-98 on press

**Buttons:**
- **Primary (Call Now, Recharge):** Indigo background, white text, rounded-lg, px-6 py-3
- **Secondary:** Outline style with border-2, transparent background
- **Success (Approve, Accept):** Green background
- **Danger (Reject, Block):** Red background 220 85% 55%
- **Icon Buttons:** Circular, p-2, for actions like follow/unfollow
- All buttons: font-medium, shadow-sm, active:scale-95 transition

**Inputs & Forms:**
- Background: Same as card backgrounds for consistency
- Border: 2px solid 240 10% 85% (Light) / 240 8% 22% (Dark)
- Focus: Border color changes to Primary Indigo
- Border Radius: rounded-lg
- Padding: px-4 py-3
- Labels: text-sm font-medium, text-secondary color
- Error states: Red border + error message below

### E. Navigation

**Mobile Bottom Nav (User & Creator Apps):**
- Fixed bottom bar, 4-5 icons
- Active state: Primary Indigo with label
- Inactive: Secondary gray, icon only
- Height: h-16 with safe area padding

**Sidebar (Admin Dashboard):**
- Fixed left sidebar, width: w-64
- Collapsible on tablet/mobile
- Logo at top, navigation items with icons
- Active item: Primary Indigo background with 10% opacity
- Hover: Subtle gray background

**Top Bar (All Apps):**
- Balance display (User app): Badge style, rounded-full, primary color
- Profile/Settings: Right-aligned icons
- Search bar (where applicable): Prominent, full-width on mobile

### F. Data Displays

**Stats Cards (Dashboard):**
- Large number: text-3xl font-bold, primary color
- Label: text-sm text-secondary
- Trend indicator: Small arrow with percentage
- Layout: Grid of 2x2 (mobile) to 4x1 (desktop)

**Tables (Transaction History, Creator List):**
- Striped rows for readability
- Sticky header on scroll
- Sortable columns with arrow indicators
- Row hover: Subtle background change
- Mobile: Card-based transformation

**Lists (Creators, Agencies):**
- Avatar + Name + Status layout
- Metadata in secondary text
- Right-aligned CTA or price
- Dividers between items (border-b)

### G. Overlays & Modals

**Modals (Profile Details, Confirmations):**
- Centered on screen, max-w-md
- Backdrop: Black with 50% opacity
- Card style with rounded-2xl
- Close button: Top-right, circular
- Actions: Bottom-aligned buttons

**Toasts (Notifications):**
- Top-right position (desktop), top-center (mobile)
- Icon + Message + Action
- Auto-dismiss after 5 seconds
- Color-coded: Success (green), Error (red), Info (blue)

**Bottom Sheets (Mobile Actions):**
- Slide up from bottom
- Rounded top corners (rounded-t-3xl)
- Drag handle at top
- Actions as list items with icons

### H. Special Components

**Call Interface:**
- Fullscreen overlay
- Large avatar centered
- Timer prominently displayed (text-2xl)
- Balance countdown visible
- Action buttons: End call (red, large), Send gift (secondary), Recharge (outline)
- Background: Gradient overlay on creator image

**Creator Profile Card (Homepage):**
- Image: aspect-ratio-3/4, rounded-xl
- Overlay gradient for text legibility
- Name + Price: Bottom overlay, white text
- Status indicator: Small dot (green=online, gray=offline)
- Tap anywhere opens full profile

**Gift Animation:**
- Floating icons during call
- Smooth entrance from bottom
- Fade out animation
- Haptic feedback on send

**Price Display:**
- Large, bold INR amount
- "per minute" in smaller text below
- Enclosed in subtle badge or outlined box

---

## Images

**Hero Images:**
- **User App Landing/Onboarding:** Diverse group of people on video calls, warm and welcoming atmosphere, lifestyle photography style
- **Creator App Dashboard:** Professional creator at work setup, confident and approachable
- **Agency Dashboard:** Team collaboration imagery, professional business setting

**Profile Pictures:**
- Circular avatars throughout
- Fallback: Initials on gradient background matching primary colors
- Multiple profile images: Horizontal scrollable gallery, aspect-ratio-4/5

**No large hero image for dashboard** - focus on data and functionality immediately.

---

## Critical UX Patterns

**Trust & Safety:**
- Privacy warning modal before first call (cannot be dismissed without acknowledgment)
- Clear balance display always visible during calls
- Transaction confirmation for all payments
- Prominent support chat access after first call

**Onboarding Flow:**
- Progressive disclosure: Basic info → Profile setup → Verification
- Clear progress indicators (steps 1/3, 2/3, 3/3)
- Skip options for optional fields, but clear CTAs for required ones

**Status Indicators:**
- Online/Offline: Green/Gray dot on avatar
- Pending Approval: Amber badge
- Verified: Blue checkmark badge
- Balance Low: Red text + notification

**Empty States:**
- Illustrative icon
- Clear headline explaining why it's empty
- Primary CTA to resolve (e.g., "Follow Creators" when Follow tab is empty)