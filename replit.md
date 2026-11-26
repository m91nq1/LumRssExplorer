# LUM News

## Gmail Email Delivery

Application email uses Gmail SMTP with a Google App Password, not Resend. Supabase remains the
authentication provider; do not replace it. Every successful login and registration
sends a security notification, regardless of news or legacy login-email opt-outs.
Both registration and each new sign-in send a "Welcome to LUM News" message,
including welcome/welcome-back guidance and successful login details, not a verification email.
Deduplicate by verified session, not by user, so subsequent logins still notify.
Supabase's **Confirm email** setting must be off, and its
signed Send Email HTTP hook must be configured for password resets to use Gmail.
See [docs/gmail-setup.md](docs/gmail-setup.md) for required environment variables,
Google App Password setup and Supabase hook instructions.
Email tests must mock delivery; never email real users without authorisation.

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
- For You (/for-you) - Personalized feed based on reading behavior (requires auth)
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

**User Authentication**: Supabase Auth for email/password authentication. Users table has `supabaseId` column linking Supabase auth to local user records. AuthContext syncs user data with backend on login and fetches local user data on session restore (without triggering login notifications).

**RSS Ingestion**: 
- Custom RSS parser using the `rss-parser` library
- Scheduled refresh every 10 minutes via node-cron
- Normalizes articles from different feed formats into a unified schema
- `server/curatedFeeds.ts` contains the requested 50 art and 20 football feeds. Startup registration matches canonical URLs, keeps existing source IDs and enabled settings, and only updates their Art/Sports category when needed. Incoming articles from these feeds retain their curated topic.
- Validate this catalogue and its idempotent registration with `npx tsx --test server/curatedFeeds.test.ts`. A registered URL is not a guarantee that its publisher currently exposes readable RSS.
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
- `users`: id, username, replitId, supabaseId, email, firstName, lastName, profileImageUrl
- `bookmarks`: id, userId, articleId (unique constraint per user)
- `read_status`: id, userId, articleId (unique constraint per user)
- `reading_progress`: id, userId, articleId, scrollPosition, percentRead, updatedAt (reading progress tracking)
- `user_preferences`: id, userId, favoriteSources, favouriteTopics, preferredRegions, defaultSearchQuery, defaultTimeFilter, emailDigestEnabled, loginNotificationEnabled, lastDigestSentAt
- `sessions`: sid, sess, expire (Replit Auth session storage)
- `news_providers`: id, name, baseUrl, apiKeyEnvVar, isEnabled, rateLimitPerDay, supportedCategories, supportedCountries

### Key Design Decisions

**PostgreSQL Storage**: Full persistence for articles, user data, bookmarks, read tracking, and preferences. Data survives restarts.

**Supabase Authentication**: Users authenticate via Supabase Auth with email/password. The supabaseId field in users table links Supabase auth to local user records. Login triggers email notifications (configurable per user).

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
- **Article Aggregation**: Ingests articles from 50+ RSS sources across 10 categories including entertainment
- **Topic-Based Filtering**: 10 topic categories (War/Conflict, US Politics, Europe Politics, AI & Technology, Finance & Markets, Crime & Justice, Science & Health, Celebrity & Entertainment, Environment/Climate, Other/Offbeat)
- **Entertainment Coverage**: 18 dedicated celebrity/entertainment sources including TMZ, Variety, Hollywood Reporter, Rolling Stone, Billboard, Page Six, Screen Rant, IGN, Pitchfork, and more
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

### For You Page (/for-you)
- **Personalized Feed**: AI-powered article recommendations based on reading behavior
- **Topic Inference**: Analyzes user bookmarks (2x weight) and read articles (1x weight) to infer interests
- **Breaking News Section**: Live articles from last 2 hours matching user's topics with "Live" badge
- **Story Clusters**: Groups articles by topic showing multiple perspectives from different sources
- **Fallback Content**: Shows trending articles when no reading behavior is available
- **Loading States**: Skeleton loaders for all sections during data fetch

### Article Detail View
- **Full Article View**: View complete article with metadata
- **Content Extraction**: On-demand extraction of full article content from original URLs using @extractus/article-extractor
- **Collapsible Content Section**: Full article content displayed in expandable section with word count
- **Related Articles**: Grid of related articles from same source with images, timestamps, and read status badges
- **Navigation**: Previous/next article navigation (chronological order)
- **Bookmark/Read Integration**: Bookmark and mark read from detail view
- **AI-Powered Summaries**: Generate intelligent article summaries using OpenAI
- **Reading Progress Tracking**: Visual progress bar at top, estimated read time, scroll position persistence
- **Progress Restoration**: Automatically restores reading position when returning to an article

### AI Summary Feature
- **OpenAI Integration**: Uses the Responses API with `gpt-5-nano` by default; admin model selection also supports `gpt-5-mini` and `gpt-5`. Summaries start disabled and cannot be enabled without a successful model-access and inference test.
- **Admin AI summaries & Secrets Tab**: Settings contains key save/update/remove, model selection, connection test, enable/disable, safe API errors and app-level token counters. The active saved model is shown separately from unsaved selections. Saving an enabled model verifies access before applying it, and invalidates the browser's article/status caches. Endpoints require a server-verified Supabase token or authenticated server session, never caller-supplied user IDs.
- **Server-Managed API Key**: Admin-entered OpenAI keys are encrypted with AES-256-GCM in existing system settings. `AI_SECRET_ENCRYPTION_KEY` (preferred) or stable `SESSION_SECRET` must be at least 32 characters; do not rotate it without re-entering stored keys. Optional `OPENAI_API_KEY` supplies an environment-managed fallback. Removing a key disables that fallback in the app; it does not delete workspace environment secrets.
- **Summary Guardrails**: Two complete prose paragraphs with 120–180 words total; paragraph lengths may differ. Only source-supported facts; one corrective retry and an explicit original-article fallback on failure. No truncation or word padding.
- **Caching**: Summaries and model/format provenance are cached atomically in the existing database; identical in-flight article requests share work. Legacy-provider summaries regenerate on demand.
- **Collapsible UI**: AI summary section is collapsible to save space when not in use
- **Error Handling**: Clear error messages for invalid API keys, rate limits, and insufficient credits

### Email Digest Feature
- **Gmail Integration**: Sends welcome and digest emails via Gmail SMTP (SMTP_USER, SMTP_PASS)
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
- **Gmail SMTP**: Email delivery service for welcome and digest emails
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

### Render portability

- Preserve the existing Supabase authentication, Neon-compatible database, OpenAI summaries and Gmail email transport when working on Render deployment. Do not replace providers or migrate/reset production data to solve hosting issues.
- Standalone deployment instructions, tested commands, environment names and limitations are in `docs/render-migration.md`; use `render.yaml` only as a free testing blueprint.
- Free Render instances block Gmail SMTP and sleep when idle. Do not promise full email/scheduler behavior there or provision paid alternatives without approval.
- Preserve existing encryption and signing secrets when moving hosts, including the session-secret fallback used by encrypted AI keys.

- **Washington Post RSS**: Feed times out occasionally (gracefully handled)
- **OpenAI Blog RSS**: Returns 403 (blocked by Cloudflare, gracefully handled)
- **CoinDesk RSS**: Feed format not recognized (gracefully handled)
- **Toast Selectors**: Toast notifications match multiple DOM elements in tests (cosmetic issue)
