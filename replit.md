# LUM RSS Explorer

## Overview

LUM RSS Explorer is a full-stack TypeScript web application that aggregates and displays world news articles from multiple RSS feeds including BBC, CNN, CNBC, NDTV, NYT, Google News, Washington Post, Reddit, Times of India, and The Guardian. The application provides a modern, Material Design 3-inspired interface for browsing, filtering, and searching news articles in real-time.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript running on Vite for development and production builds.

**UI System**: The application uses shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling. The design follows Material Design 3 principles with inspiration from Feedly and Inoreader, optimized for information-dense news aggregation.

**State Management**: TanStack Query (React Query) manages server state, data fetching, and caching. Local UI state is managed with React hooks (useState, useEffect).

**Routing**: Wouter provides lightweight client-side routing.

**Layout Pattern**: Fixed sidebar layout (280px) with a fluid main content area. The interface uses a responsive grid system that adapts from single-column on mobile to two-column on desktop.

**Typography**: Inter font family for headings and UI elements, system fonts for body text to optimize readability.

### Backend Architecture

**Runtime**: Node.js with TypeScript using ES modules.

**HTTP Framework**: Express.js handles API requests and serves static assets.

**Development vs Production**: Separate entry points (`index-dev.ts` uses Vite middleware for HMR, `index-prod.ts` serves pre-built static assets).

**Data Storage**: In-memory storage using a Map-based ArticleStore class. The architecture is designed to be easily swappable with a database backend (Drizzle ORM configuration present for future PostgreSQL integration).

**RSS Ingestion**: 
- Custom RSS parser using the `rss-parser` library
- Scheduled refresh every 10 minutes via node-cron
- Normalizes articles from different feed formats into a unified schema
- Generates stable IDs using SHA-256 hashing of article links

**API Design**:
- RESTful endpoints at `/api/articles` and `/api/sources`
- Query parameters for filtering (sourceId, search, since, pagination)
- Zod schema validation for all API inputs and outputs
- Paginated responses (default 20 items per page)

### Data Flow

1. **Initialization**: ArticleStore fetches all RSS feeds on startup and stores articles in memory
2. **Scheduled Updates**: Cron job refreshes feeds every 10 minutes, merging new articles
3. **Client Requests**: React components query the API with filters, receiving paginated results
4. **Real-time Stats**: Header displays total article count, source count, and last refresh time

### Key Design Decisions

**In-Memory Storage**: Chosen for simplicity and fast read performance. Articles are stored in a Map keyed by generated ID. Trade-off: data lost on restart, but acceptable for news aggregation where fresh data is preferred.

**Scheduled Refresh Pattern**: 10-minute intervals balance freshness with API politeness. Manual refresh available for immediate updates.

**Client-Side Filtering**: Some filtering done client-side (particularly source selection), reducing API calls while maintaining responsive UI.

**Pagination**: Server-side pagination prevents overwhelming the client with thousands of articles, improving performance and UX.

**Component Architecture**: Modular components (ArticleCard, ArticleGrid, Sidebar, etc.) promote reusability and maintainability.

## External Dependencies

### Core Framework Dependencies
- **React 18**: UI library
- **Express**: HTTP server framework
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety across the stack

### UI Component Libraries
- **Radix UI**: Unstyled, accessible component primitives (accordion, dialog, dropdown, radio-group, checkbox, etc.)
- **shadcn/ui**: Pre-styled components built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Data & State Management
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling with Zod validation
- **Zod**: Runtime type validation and schema definition
- **date-fns**: Date formatting and manipulation

### RSS & Scheduling
- **rss-parser**: RSS/Atom feed parsing
- **node-cron**: Scheduled task execution

### Database (Configured, Not Yet Used)
- **Drizzle ORM**: Type-safe ORM for PostgreSQL
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-zod**: Zod schema generation from Drizzle schemas

The application is structured to migrate from in-memory storage to PostgreSQL by implementing the existing schema definitions in `shared/schema.ts` with Drizzle ORM.

### Development Tools
- **Wouter**: Lightweight routing
- **nanoid**: Unique ID generation
- **clsx & class-variance-authority**: Conditional CSS class management
- **@replit/vite-plugin-***: Replit-specific development tools