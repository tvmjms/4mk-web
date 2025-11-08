# 4MK Community Needs Platform - Design Guidelines

## Design Approach: Material Design with Community Focus
Drawing inspiration from Material Design's information density principles and community platforms like Nextdoor and Buy Nothing groups, emphasizing clarity, accessibility, and trust-building for a needs-sharing community.

## Core Design Principles
1. **Trust Through Clarity**: Clean, organized layouts that build confidence
2. **Scannable Information**: Easy-to-digest needs listings and receipts
3. **Compassionate Design**: Warm, approachable aesthetics for sensitive community needs
4. **Action-Oriented**: Clear CTAs for giving, requesting, and connecting

## Typography System

### Font Families
- **Primary**: Inter (via Google Fonts) - clean, readable for body text and UI
- **Display/Headers**: Outfit (via Google Fonts) - friendly, approachable for headings

### Hierarchy
- **Hero/Page Titles**: text-4xl md:text-5xl, font-bold
- **Section Headers**: text-2xl md:text-3xl, font-semibold  
- **Card Titles**: text-xl, font-semibold
- **Body Text**: text-base, font-normal
- **Small Text/Meta**: text-sm, font-medium
- **Captions**: text-xs

## Spacing System
Use Tailwind spacing units: **2, 4, 8, 12, 16** for consistency
- **Micro spacing**: gap-2, p-2 (buttons, tight groups)
- **Component spacing**: gap-4, p-4 (cards, form fields)
- **Section spacing**: gap-8, py-8 (between content blocks)
- **Page spacing**: py-12 md:py-16 (major sections)
- **Container padding**: px-4 md:px-8 lg:px-12

## Layout System

### Grid Structures
- **Needs Feed**: Single column mobile, 2-column tablet (md:), 3-column desktop (lg:)
- **Dashboard**: Sidebar (w-64) + main content area
- **Forms**: Single column, max-w-2xl centered

### Container Widths
- **Full-width sections**: w-full with max-w-7xl mx-auto
- **Content sections**: max-w-6xl
- **Forms/focused content**: max-w-2xl

## Component Library

### Navigation
**Top Navigation Bar**
- Fixed header with shadow-sm
- Logo left, navigation center, user actions right
- Mobile: Hamburger menu with slide-out drawer
- Height: h-16

### Needs Cards
**Primary Card Pattern**
- Rounded corners: rounded-lg
- Subtle elevation: shadow-md, hover:shadow-lg transition
- Padding: p-6
- Structure:
  - Header: User avatar (w-10 h-10 rounded-full) + name + timestamp
  - Need title: text-xl font-semibold
  - Description: text-base, line-clamp-3
  - Footer: Status badge + action buttons (flex justify-between)

### Receipt Display
**Condensed Receipt Layout** (as per existing implementation)
- Compact header with icon
- Line-item format with clear labels
- Totals section with emphasis
- Print/share action buttons

### Forms
**Input Fields**
- Label above field: text-sm font-medium, mb-2
- Input height: h-12
- Rounded: rounded-lg
- Focus states with ring treatment
- Helper text: text-xs, mt-1

**Button Hierarchy**
- Primary: px-6 py-3, rounded-lg, font-semibold
- Secondary: px-6 py-3, rounded-lg, font-medium, border-2
- Ghost/Text: px-4 py-2, font-medium
- Icon buttons: w-10 h-10, rounded-full

### Modals & Overlays
- Backdrop: backdrop-blur-sm
- Modal: rounded-xl, max-w-lg, p-8
- Close button: top-right, w-8 h-8

### Status Badges
- Small pill shape: px-3 py-1, rounded-full, text-xs font-semibold
- Types: Active, Fulfilled, Closed

### User Profiles
- Avatar sizes: Small (w-8 h-8), Medium (w-12 h-12), Large (w-24 h-24)
- Always rounded-full
- Include fallback initials for users without photos

## Page Layouts

### Landing Page
**Hero Section** (h-[600px])
- Large hero image showing community helping each other
- Centered content with heading + subheading + dual CTAs
- Semi-transparent overlay for text readability

**Features Grid** (3 columns on desktop)
- Icon + title + description cards
- Icons from Material Icons via CDN

**How It Works** (Numbered steps)
- Horizontal layout on desktop (3-4 steps)
- Large numbers, clear descriptions

**Community Stats**
- 4-column grid: Needs posted, Needs fulfilled, Active members, Hours saved
- Large numbers with labels

**CTA Section**
- Full-width, centered
- Primary action button with supporting text

### Dashboard
**Sidebar Navigation** (w-64, fixed)
- User profile card at top
- Navigation links with icons
- Logout at bottom

**Main Content Area**
- Tabbed interface: My Needs / Community Needs / Fulfilled
- Filter bar: Search + category dropdowns + sort
- Needs grid with infinite scroll/pagination

### Need Detail Page
- Breadcrumb navigation
- Two-column layout (lg:): Need details (8/12) + Sidebar (4/12)
- Sidebar: Poster profile, similar needs, share options

### Create/Edit Need Form
- Step indicator if multi-step
- Single column, max-w-2xl
- Field groups with clear headings
- Image upload with preview
- Save draft + Publish buttons

## Icons
Use **Material Icons** via CDN
- Navigation: home, list, add_circle, person, settings
- Actions: share, bookmark, favorite, more_vert
- Status: check_circle, pending, cancel
- Categories: food, house, medical, transportation, etc.

## Images
**Hero Image**: Full-width background showing diverse community members helping each other, friendly and warm atmosphere (1920x600px minimum)

**Need Cards**: Optional user-uploaded images, aspect ratio 16:9, object-cover, rounded-lg

**User Avatars**: Circular, with fallback to colored background + initials if no photo

**Empty States**: Friendly illustrations for "No needs found" etc.

## Accessibility
- Minimum touch target: 44x44px
- Consistent focus indicators (ring-2 ring-offset-2)
- Semantic HTML throughout
- ARIA labels for icon-only buttons
- Form error messages with icons and clear text
- High contrast text throughout

## Responsive Breakpoints
- Mobile: base (< 768px)
- Tablet: md: (768px+)
- Desktop: lg: (1024px+)
- Wide: xl: (1280px+)

## Animation (Minimal)
- Card hover: transform scale-[1.02] transition-transform duration-200
- Button hover: subtle opacity change
- Page transitions: fade-in for content loads
- No auto-playing animations

This design creates a trustworthy, accessible community platform that prioritizes clarity and ease of use while maintaining visual appeal through thoughtful spacing, typography, and component design.