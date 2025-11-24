# LUM RSS Explorer - Design Guidelines

## Design Approach

**System Selected:** Material Design 3 with inspiration from Feedly and Inoreader
**Rationale:** Information-dense news aggregator requiring efficient scanning, filtering, and reading patterns. Material Design 3 provides excellent typography hierarchy, card systems, and interaction patterns perfect for content-heavy dashboards.

## Typography System

**Font Families:**
- Primary: Inter (headings, UI elements, article titles)
- Secondary: System UI (body text, article snippets for optimal readability)

**Type Scale:**
- App title/header: 24px, semibold
- Article titles: 18px, medium, line-height 1.4
- Source names: 14px, medium, uppercase tracking
- Snippets/body: 15px, regular, line-height 1.6
- Metadata (dates, counts): 13px, regular
- Sidebar labels: 14px, medium

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 (p-2, p-4, p-6, p-8, etc.)

**Grid Structure:**
- Desktop: Fixed left sidebar (280px width), fluid main content area (remaining width)
- Sidebar: Fixed position, full viewport height, scrollable content
- Main content: max-w-7xl container with padding
- Article grid: 1 column on tablet, 2 columns on large desktop (gap-6)

**Vertical Rhythm:**
- Section spacing: py-6 to py-8
- Card internal padding: p-6
- List item spacing: gap-4
- Filter group spacing: mb-6

## Component Library

### Top Navigation Bar
- Full-width, fixed position
- Height: 64px
- Contains: App logo/name (left), stats display (center), manual refresh button (right)
- Stats format: "1,247 Articles • 10 Sources • Updated 2 min ago"
- Refresh button: Icon + "Refresh" label, subtle hover elevation

### Left Sidebar (280px fixed)
- Sections from top to bottom:
  1. Search box (mb-6)
  2. Time filters (radio buttons: Last 24h, Last 7 days, All)
  3. Source filters (checkboxes with article counts)
  
- Search box: Full-width input with search icon, placeholder "Search articles..."
- Filter groups: Clear section headers, consistent spacing
- Source checkboxes: Source name + article count badge on right (e.g., "BBC News 47")
- Scrollable content area with subtle scrollbar

### Article Cards
- Card structure:
  - Source badge (top-left, small pill with source name)
  - Article title (prominent, 2-line clamp)
  - Summary/snippet (3-line clamp, muted)
  - Metadata row: Published time (relative, e.g., "2 hours ago")
  - Subtle hover elevation + border accent
  
- Card spacing: p-6 internal, gap-6 between cards
- Click target: Entire card is clickable, opens in new tab
- Transition: 150ms ease for hover states

### Empty States
- When no articles match filters: Large icon, "No articles found" heading, suggestion text
- Initial loading: Skeleton cards (3-4 placeholders)

### Loading & Refresh States
- Inline refresh indicator when manually triggered
- Skeleton loaders for article cards during initial load
- Smooth fade-in for newly loaded articles

## Interaction Patterns

**Filtering Behavior:**
- Instant filter application (no "Apply" button needed)
- URL updates to preserve filter state
- Selected filters show visual distinction
- "Clear all filters" link when filters active

**Search Behavior:**
- Debounced search (300ms delay)
- Highlights matching terms in titles/snippets
- Shows result count

**Article Interactions:**
- Hover: Subtle elevation increase, border accent appears
- Click: Opens link in new tab
- No right-side preview pane (keeps focus on list view)

## Visual Hierarchy Principles

1. **Scannable Typography:** Bold article titles, muted snippets create clear information hierarchy
2. **Source Attribution:** Source badges provide instant visual recognition without overwhelming
3. **Temporal Ordering:** Most recent articles first, relative timestamps for quick context
4. **Filter Clarity:** Active filters always visible, easy to modify or clear
5. **Breathing Room:** Generous whitespace between cards prevents overwhelming density

## Animations

**Minimal, purposeful animations:**
- Card hover: transform scale(1.01) + shadow elevation (150ms ease)
- Filter selection: checkbox check animation (100ms)
- Refresh button: rotate icon 360deg while loading
- New articles: fade-in from top (200ms)
- Avoid: scroll-triggered effects, complex transitions

## Responsive Considerations

**Desktop-first (primary focus):**
- Optimal viewing: 1440px+ width
- Minimum supported: 1024px width
- Below 1024px: Sidebar collapses to overlay/drawer pattern

This design prioritizes efficient information consumption with clean visual hierarchy, allowing users to quickly scan, filter, and access global news from multiple sources in a unified interface.