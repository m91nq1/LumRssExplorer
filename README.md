# LUM RSS Explorer

A full-stack TypeScript web application that aggregates and displays world news articles from multiple RSS feeds in a beautiful, modern interface.

## Features

- **Multi-Source RSS Aggregation**: Ingests articles from 10 major news sources including BBC, CNN, CNBC, NDTV, NYT, Google News, Washington Post, Reddit, Times of India, and The Guardian
- **Smart Filtering**: Filter articles by source, search keywords, and time period (24 hours, 7 days, or all)
- **Real-time Updates**: Automatic refresh every 10 minutes, plus manual refresh on demand
- **Modern UI**: Clean, Material Design 3-inspired interface with dark/indigo theme
- **Responsive Design**: Desktop-optimized layout with fixed sidebar and fluid main content area
- **Pagination**: Navigate through large article collections with ease

## Tech Stack

### Frontend
- React 18 with TypeScript
- Wouter for routing
- TanStack Query (React Query) for data fetching and caching
- Tailwind CSS + shadcn/ui components
- Inter font for typography
- date-fns for date formatting

### Backend
- Node.js with Express
- TypeScript
- rss-parser for RSS feed ingestion
- node-cron for scheduled updates
- Zod for validation
- In-memory storage with Map

## Getting Started

### Prerequisites
- Node.js 20 or higher

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

The backend will automatically:
- Fetch articles from all configured RSS feeds on startup
- Refresh all feeds every 10 minutes
- Handle individual feed failures gracefully

## Configuration

### RSS Feed Sources

To add, remove, or modify RSS feeds, edit `server/rssFeedsConfig.ts`:

```typescript
export const RSS_FEEDS: FeedSource[] = [
  {
    id: "unique-id",
    name: "Source Name",
    url: "https://example.com/feed.xml",
    sourceType: "rss",
    country: "Country", // optional
    category: "world",
  },
  // Add more feeds here...
];
```

### Refresh Interval

To change the automatic refresh interval, edit the cron schedule in `server/articleStore.ts`:

```typescript
// Current: every 10 minutes
cron.schedule("*/10 * * * *", async () => {
  // ...
});

// Examples:
// Every 5 minutes: "*/5 * * * *"
// Every 15 minutes: "*/15 * * * *"
// Every hour: "0 * * * *"
```

## API Endpoints

### GET /api/articles
Returns paginated articles with optional filtering.

**Query Parameters:**
- `sourceId` (string, optional): Filter by one or more source IDs (comma-separated)
- `search` (string, optional): Search in article titles and summaries
- `since` (ISO date string, optional): Only return articles published after this date
- `page` (number, default: 1): Page number for pagination
- `pageSize` (number, default: 20, max: 100): Number of articles per page

**Response:**
```json
{
  "articles": [...],
  "total": 275,
  "page": 1,
  "pageSize": 20,
  "totalPages": 14
}
```

### GET /api/sources
Returns list of all sources with article counts and last refresh time.

**Response:**
```json
{
  "sources": [
    {
      "id": "bbc-world",
      "name": "BBC News",
      "articleCount": 42
    }
  ],
  "lastRefreshTime": "2024-11-24T16:20:35.000Z"
}
```

### POST /api/refresh
Triggers manual refresh of all RSS feeds.

**Response:**
```json
{
  "success": true,
  "message": "Feed refreshed successfully"
}
```

## Project Structure

```
├── client/                  # Frontend code
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities
│   │   └── App.tsx         # Main app component
│   └── index.html
├── server/                  # Backend code
│   ├── rssFeedsConfig.ts   # RSS feed configuration
│   ├── rssIngestor.ts      # RSS parsing and normalization
│   ├── articleStore.ts     # In-memory article storage
│   ├── routes.ts           # API route handlers
│   └── index-dev.ts        # Development server entry
├── shared/                  # Shared types and schemas
│   └── schema.ts           # Zod schemas and TypeScript types
└── package.json
```

## Features in Detail

### Search
- 300ms debounce to reduce unnecessary API calls
- Searches across article titles and summaries
- Case-insensitive matching

### Time Filters
- **Last 24 hours**: Shows articles published in the last day
- **Last 7 days**: Shows articles from the past week
- **All**: Shows all available articles (default)

### Source Filters
- Select one or multiple sources using checkboxes
- Each source shows its current article count
- "Clear all" button to reset all filters at once

### Article Cards
- Display source badge, title, summary, and relative timestamp
- Hover animation for better UX
- Entire card is clickable
- Opens article in new tab when clicked

### Pagination
- 20 articles per page by default
- Previous/Next navigation
- Current page indicator

## Known Limitations

- Some RSS feeds may occasionally fail due to network timeouts or access restrictions (e.g., Reddit returns 403)
- The application uses in-memory storage, so article data is lost on server restart
- Articles are deduplicated by link, so updates to existing articles won't appear

## Future Enhancements

- Replace in-memory storage with PostgreSQL for persistence
- Add user preferences and saved searches
- Implement article bookmarking
- Add RSS feed management UI
- Create detailed article view with full content extraction
- Add real-time notifications for new articles

## License

MIT
