# LUM News

## Overview

LUM News (formerly LUM RSS Explorer) is a full-stack TypeScript web application that aggregates and displays world news articles from multiple RSS feeds and external news APIs. The application provides a modern, Material Design 3-inspired interface for browsing, filtering, and searching news articles in real-time.

## Setup

For fresh environments, run database migrations first:
```bash
npm run db:push
```

This creates all required tables including articles, users, bookmarks, read_status, user_preferences, sessions, and news_providers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript running on Vite for development and production builds.

**UI System**: The application uses shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling. The design follows Material Design 3 principles with inspiration from Feedly and Inoreader, optimized for information-dense news aggregation.

**State Management**: TanStack Query (React Query) manages server state, data fetching, and caching. Local UI state is managed with React hooks (useState, useEffect, useRef).

**Routing**: Wouter provides lightweight client-side routing with pages for:
- Home (/) - Main feed view (authenticated) or Landing page (unauthenticated)
- Landing (/landing) - Public landing page
- Article Detail (/article/:id) - Individual article view (requires auth)
- Feed Management (/feeds) - Admin feed management (requires auth)
- Settings (/settings) - User preferences (requires auth)
- Profile (/profile) - Account info and topic/region preferences (requires auth)
- Bookmarks (/bookmarks) - Saved articles (requires auth)
- History (/history) - Read article timeline (requires auth)
- Search (/search) - Search page (requires auth)
- About (/about) - Public about page
- Privacy Policy (/privacy) - Legal privacy policy (public)
- Terms of Service (/terms) - Legal terms of service (public)

**Route Protection**: Protected routes require authentication. Unauthenticated users are shown the Landing page when attempting to access protected routes.

**Layout Pattern**: Fixed sidebar layout (280px) with a fluid main content area. The interface uses a responsive grid system that adapts from single-column on mobile to two-column on desktop.

**Typography**: Inter font family for headings and UI elements, system fonts for body text to optimize readability.

### Backend Architecture

**Runtime**: Node.js with TypeScript using ES modules.

**HTTP Framework**: Express.js handles API requests and serves static assets.

**Development vs Production**: Separate entry points (`index-dev.ts` uses Vite middleware for HMR, `index-prod.ts` serves pre-built static assets).

**Data Storage**: PostgreSQL database using Drizzle ORM for type-safe queries. Neon serverless driver for connection pooling.

**User Authentication**: Lightweight header-based user identification using X-Username header. LocalStorage on frontend stores username, middleware on backend retrieves or creates user records.

**RSS Ingestion**: 
- Custom RSS parser using the `rss-parser` library
- Scheduled refresh every 10 minutes via node-cron
- Normalizes articles from different feed formats into a unified schema
- Generates stable IDs using SHA-256 hashing of article links

**External News API Integration**:
- Three API providers: Mediastack, NewsAPI.org, Newsdata.io
- Providers fetch articles into main feed alongside RSS sources
- External providers use sourceType='api' and source IDs like 'external-{providerId}'
- Articles from APIs get topic tagging and polarization scoring
- News provider service initializes BEFORE article store (critical for scheduled refresh)
- Environment secrets: MEDIASTACK_KEY, NEWSAPI_ORG_KEY, NEWSDATA_IO_KEY

**API Design**:
- RESTful endpoints at `/api/articles`, `/api/sources`, `/api/feeds`, `/api/bookmarks`, `/api/read-status`, `/api/preferences`
- Query parameters for filtering (sourceId, search, since, pagination)
- Zod schema validation for all API inputs and outputs
- Paginated responses (default 20 items per page)

### Data Flow

1. **Initialization**: ArticleStore fetches all enabled RSS feeds on startup and stores articles in PostgreSQL
2. **Scheduled Updates**: Cron job refreshes feeds every 10 minutes, merging new articles
3. **Client Requests**: React components query the API with filters, receiving paginated results
4. **Real-time Stats**: Header displays total article count, source count, and last refresh time
5. **User Context**: X-Username header identifies user for bookmarks, read status, and preferences

### Database Schema

**Tables**:
- `articles`: id, sourceId, title, link, summary, content, imageUrl, aiSummary, publishedAt, createdAt
- `feed_sources`: id, name, url, sourceType, country, category, isEnabled
- `users`: id, username, replitId, email, firstName, lastName, profileImageUrl
- `bookmarks`: id, userId, articleId (unique constraint per user)
- `read_status`: id, userId, articleId (unique constraint per user)
- `user_preferences`: id, userId, favoriteSources, favouriteTopics, preferredRegions, defaultSearchQuery, defaultTimeFilter, emailDigestEnabled
- `sessions`: sid, sess, expire (Replit Auth session storage)
- `news_providers`: id, name, baseUrl, apiKeyEnvVar, isEnabled, rateLimitPerDay, supportedCategories, supportedCountries

### Key Design Decisions

**PostgreSQL Storage**: Full persistence for articles, user data, bookmarks, read tracking, and preferences. Data survives restarts.

**Header-Based User Identification**: Simple username in localStorage sent via X-Username header. No password authentication for MVP - users are identified by username only.

**Scheduled Refresh Pattern**: 10-minute intervals balance freshness with API politeness. Manual refresh available for immediate updates.

**Server-Side Filtering**: Filtering done server-side with PostgreSQL queries for optimal performance.

**Pagination**: Server-side pagination prevents overwhelming the client with thousands of articles.

**Component Architecture**: Modular components (ArticleCard, ArticleGrid, Sidebar, etc.) promote reusability and maintainability.

## Features

### Landing Page (/)
- **Futuristic Hero Design**: Dark theme with purple/indigo glow effects and glassmorphism
- **3D Interactive Globe**: Three.js-powered Earth with neon holographic shader, OrbitControls for interaction
- **Tagline**: "The world's narratives in your hands"
- **Feature Cards**: Top Stories, Lenses, Alerts & Digests preview cards
- **CSS Animations**: Fade-in effects on load, hover-elevate interactions

### Core Features
- **Article Aggregation**: Ingests articles from 23+ RSS sources across 9 categories
- **Topic-Based Filtering**: 10 topic categories (War/Conflict, US Politics, Europe Politics, AI & Technology, Finance & Markets, Crime & Justice, Science & Health, Celebrity & Entertainment, Environment/Climate, Other/Offbeat)
- **Region Filtering**: Filter by region (Global, US, Europe, UK, Russia, China, Africa, Middle East, Asia-Pacific)
- **Most Polarised Toggle**: Sort articles by polarisation/controversy score
- **Source Filtering**: Filter by source, time period, and search query
- **Pagination**: Browse through articles with page navigation
- **Dark Violet Theme**: Dark mode with violet (#1E174B) accent colors

### User Features
- **Bookmarking**: Save articles for later reading
- **Read Tracking**: Mark articles as read, visual distinction for read vs unread
- **User Preferences**: Save favorite sources, default search, and time filter as defaults
- **Preference Restoration**: Saved preferences restored on page load
- **Topic Preferences**: Select favorite topics for personalized digests at /settings
- **Region Preferences**: Select preferred regions for filtering digests
- **Email Digests**: Opt-in to receive personalized news digests via email

### Admin Features
- **Feed Management**: Add, edit, delete, enable/disable RSS feeds at /feeds
- **Manual Refresh**: Trigger immediate feed refresh
- **Run Digests**: POST /api/admin/run-digests triggers personalized email digests for all users with topic preferences
- **Send Welcome Email**: POST /api/admin/send-welcome sends test welcome email

### Article Detail View
- **Full Article View**: View complete article with metadata
- **Related Articles**: See other articles from the same source
- **Navigation**: Previous/next article navigation (chronological order)
- **Bookmark/Read Integration**: Bookmark and mark read from detail view
- **AI-Powered Summaries**: Generate intelligent article summaries using Grok AI via OpenRouter

### AI Summary Feature
- **OpenRouter Integration**: Uses OpenRouter API to access Grok 3.1 Mini model for generating summaries
- **User-Provided API Keys**: Users provide their own OpenRouter API key (stored locally in browser)
- **Caching**: Generated summaries are cached in the database to avoid redundant API calls
- **Collapsible UI**: AI summary section is collapsible to save space when not in use
- **Error Handling**: Clear error messages for invalid API keys, rate limits, and insufficient credits

### Email Digest Feature
- **Resend Integration**: Sends welcome and digest emails via Resend API (RESEND_API_KEY)
- **Welcome Emails**: Automatic welcome email after user registration
- **Personalized Digests**: Email digests based on user's favorite topics and preferred regions
- **Multiple News Sources**: Aggregates stories from NewsAPI.org, Newsdata.io, and Mediastack APIs
- **Admin Trigger**: POST /api/admin/run-digests runs digests for all opted-in users

## External Dependencies

### Core Framework Dependencies
- **React 18**: UI library
- **Express**: HTTP server framework
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety across the stack

### UI Component Libraries
- **Radix UI**: Unstyled, accessible component primitives
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

### Email & External News APIs
- **Resend**: Email delivery service for welcome and digest emails
- **NewsAPI.org**: External news API for digest stories
- **Newsdata.io**: External news API for digest stories
- **Mediastack**: External news API for digest stories

### Database
- **Drizzle ORM**: Type-safe ORM for PostgreSQL
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-zod**: Zod schema generation from Drizzle schemas

### 3D Visualization
- **Three.js**: WebGL-based 3D rendering for interactive globe
- **Custom Shaders**: Holographic effect with grid pattern and atmospheric glow

### Development Tools
- **Wouter**: Lightweight routing
- **nanoid**: Unique ID generation
- **clsx & class-variance-authority**: Conditional CSS class management
- **@replit/vite-plugin-***: Replit-specific development tools

## Known Issues

- **Washington Post RSS**: Feed times out occasionally (gracefully handled)
- **OpenAI Blog RSS**: Returns 403 (blocked by Cloudflare, gracefully handled)
- **CoinDesk RSS**: Feed format not recognized (gracefully handled)
- **Toast Selectors**: Toast notifications match multiple DOM elements in tests (cosmetic issue)
