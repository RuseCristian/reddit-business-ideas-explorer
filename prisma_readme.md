# Reddit Business Ideas Explorer - Prisma Setup

This project now includes Prisma ORM integration with a Neon PostgreSQL database for managing business ideas scraped from Reddit.

## Database Setup

### 1. Configure Your Neon Database

1. Go to [Neon.tech](https://neon.tech) and create a new database
2. Copy your database connection string
3. Update the `DATABASE_URL` in your `.env` file:

```env
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

### 2. Push the Database Schema

```bash
npm run db:push
```

This will create all the necessary tables in your Neon database based on the Prisma schema.

### 3. Generate Prisma Client

```bash
npm run db:generate
```

## Database Schema

The database includes the following models:

- **Users**: Stores user information (integrated with Clerk authentication)
- **BusinessIdea**: Stores scraped business ideas from Reddit
- **SavedIdea**: Many-to-many relationship for users saving ideas
- **Comment**: User comments on business ideas
- **Tag**: Tags for categorizing ideas
- **IdeaTag**: Many-to-many relationship between ideas and tags

## Available Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:reset` - Reset database (⚠️ destructive)

## API Endpoints

### Business Ideas

- `GET /api/ideas` - Get all business ideas
  - Query params: `limit`, `offset`, `search`, `tag`
- `POST /api/ideas` - Create a new business idea

### User Operations

- `GET /api/user/saved?userId=xxx` - Get saved ideas for a user
- `POST /api/user/saved` - Save an idea for a user
- `DELETE /api/user/saved` - Remove a saved idea

## Usage Examples

### Fetching Business Ideas

```typescript
import { DatabaseService } from "./lib/database";

// Get all ideas
const ideas = await DatabaseService.getAllBusinessIdeas(20, 0);

// Search ideas
const searchResults = await DatabaseService.searchBusinessIdeas("AI startup");

// Get ideas by tag
const taggedIdeas = await DatabaseService.getIdeasByTag("technology");
```

### Using in Astro Pages

```astro
---
// pages/ideas.astro
import { DatabaseService } from '../lib/database'
import BusinessIdeas from '../components/BusinessIdeas.tsx'

const ideas = await DatabaseService.getAllBusinessIdeas(50)
---

<html>
<head>
  <title>Business Ideas</title>
  <link rel="stylesheet" href="/src/styles/BusinessIdeas.css">
</head>
<body>
  <BusinessIdeas initialIdeas={ideas} client:load />
</body>
</html>
```

### Creating New Ideas

```typescript
// Example data structure for a new idea
const newIdea = {
	title: "AI-Powered Recipe Generator",
	description:
		"Use AI to generate personalized recipes based on dietary restrictions",
	subreddit: "entrepreneur",
	redditUrl: "https://reddit.com/r/entrepreneur/post/123",
	upvotes: 245,
	tags: ["AI", "food", "health"],
};

// POST to /api/ideas
const response = await fetch("/api/ideas", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify(newIdea),
});
```

## Integration with Existing Data

If you have existing Reddit scraping scripts, you can integrate them by:

1. Modifying your scraping scripts to use the new database schema
2. Using the `DatabaseService` methods to store scraped data
3. Running data migration scripts to move existing data

## Security Notes

- The current API endpoints are simplified for development
- In production, integrate proper Clerk authentication
- Add input validation and sanitization
- Implement rate limiting for API endpoints
- Use environment-specific database URLs

## Next Steps

1. Replace the temporary `userId` with proper Clerk authentication
2. Add data validation with Zod or similar
3. Implement pagination for large datasets
4. Add caching with Redis for better performance
5. Set up database backups and monitoring
