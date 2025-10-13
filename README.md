# Vantange - AI business Leads - Web Application

> **Part 1 of 2-Part System**  
> **Frontend & API Platform** | Complete system includes **[AI Data Pipeline →](https://github.com/RuseCristian/reddit-business-ideas-data-pipeline)** _(Python/LLM processing)_

Transform Reddit discussions into actionable business insights with AI-powered discovery and comprehensive analytics dashboard.

[![Astro](https://img.shields.io/badge/Astro-5.13.9-FF5D01?logo=astro&logoColor=white)](https://astro.build/)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16.2-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

<div align="center">
  <img src="https://github.com/user-attachments/assets/423b6b7a-c632-49b3-96c8-3b5d0ab4e558" alt="Reddit Business Ideas Explorer Dashboard" width="700"/>
</div>

---

## System Overview

**Vantage** is a full-stack platform that leverages AI and machine learning to discover and analyze business opportunities within Reddit community discussions. Instead of manually browsing thousands of posts, the system processes content from business-focused subreddits and transforms user pain points into structured business insights.

### Two-Part Architecture

1. **AI Data Pipeline** ([Repository →](https://github.com/RuseCristian/reddit-business-ideas-data-pipeline)): Reddit scraping → LLM analysis → ML clustering → Database storage
2. **Web Application** (this repository): Advanced frontend → REST APIs → User management → Analytics dashboard

### Core Features

- **Intelligent Business Discovery**: AI algorithms identify genuine market gaps and pain points
- **Impact-Driven Insights**: Multi-factor scoring system evaluating commercial potential
- **Real-Time Analytics**: Comprehensive dashboard tracking trends across communities
- **Advanced Search Engine**: Multi-dimensional filtering and semantic search capabilities
- **Personalized Experience**: User dashboards with bookmarking and activity tracking

---

## Key Features

### AI-Powered Discovery

- Smart clustering algorithms group related discussions into business opportunities
- Sentiment analysis tracks community emotions and frustration points
- Impact scoring system rates business potential on 1-10 scale
- Pain point detection identifies genuine market gaps

### Analytics Dashboard

- Community performance metrics and engagement rates
- Trend analysis with time-based patterns and seasonal opportunities
- Business metrics including impact score distributions and market gap identification
- User insights with exploration patterns and bookmark analytics

### User Experience

- Smart dashboard with recently viewed opportunities and saved ideas
- Activity tracking with comprehensive user journey analytics
- Advanced bookmarking system with categorization
- Multi-dimensional search with semantic matching

---

## Technology Stack

### Frontend

| Technology     | Version  | Purpose                                   |
| -------------- | -------- | ----------------------------------------- |
| **Astro**      | `5.13.9` | SSR Framework with zero-JS by default     |
| **React**      | `19.1.1` | Interactive UI components                 |
| **TypeScript** | `5.6.3`  | Type safety and enhanced development      |
| **Sass**       | `1.79.3` | Advanced styling and component modularity |

### Backend & Database

| Technology     | Version  | Purpose                                 |
| -------------- | -------- | --------------------------------------- |
| **Prisma**     | `6.16.2` | Type-safe database ORM                  |
| **PostgreSQL** | Latest   | Primary database with advanced indexing |
| **Clerk**      | `6.13.2` | Authentication and user management      |
| **Node.js**    | `18+`    | API routes and server-side processing   |

---

## Database Architecture

### Core Schema

The system uses a sophisticated database design with the following key entities:

- **BusinessOpportunity**: Core opportunities with AI-calculated impact scores, pain severity, and market analysis
- **Subreddit → Posts → Comments**: Reddit content hierarchy with processing status
- **Cluster**: AI-grouped related discussions with similarity scoring
- **User Activities & Bookmarks**: Complete interaction tracking and personalization

### Key Features

- Advanced relationship mapping between opportunities and source content
- User analytics with rich metadata tracking
- AI-generated solution mapping and business models
- Performance-optimized indexing on high-query columns

---

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- Clerk account for authentication

### Installation

```bash
# Clone and install
git clone https://github.com/RuseCristian/reddit-business-ideas-explorer.git
cd reddit-business-ideas-explorer
npm install

# Database setup
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev  # http://localhost:4321
```

### Environment Configuration

Create a `.env` file with:

```env
# Database Configuration
DB_HOST=your-database-host.amazonaws.com
DB_NAME=reddit_business_ideas
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=5432
DB_SSL_MODE=require
DB_CHANNEL_BINDING=require
DATABASE_URL="postgresql://your_username:your_password@your-database-host.amazonaws.com:5432/reddit_business_ideas"

# Clerk authentication (get from dashboard.clerk.com)
PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_key_here"
CLERK_SECRET_KEY="sk_test_your_secret_here"
```

---

## Available Scripts

```bash
npm run dev          # Development server with hot reload
npm run build        # Production build with optimizations
npm run preview      # Preview production build
npm run db:studio    # Visual database browser
npm run db:migrate   # Apply database migrations
npm run lint         # Code quality checks
npm run format       # Auto-format code
```

---

## Important Note

This web application displays processed opportunities but does not generate them. To populate your database with actual business opportunities, you must first run the companion **AI data processing pipeline**:

**[Data Pipeline Repository →](https://github.com/RuseCristian/reddit-business-ideas-data-pipeline)**

**Setup Order**: Data Pipeline → Database → Web Application

---

## Project Structure

```
reddit-business-ideas-explorer/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── dashboard/      # Dashboard-specific widgets
│   │   ├── layout/         # Navigation and structure
│   │   └── common/         # Shared utilities
│   ├── pages/              # Astro pages and API routes
│   │   ├── api/            # RESTful backend endpoints
│   │   ├── dashboard/      # Protected user areas
│   │   └── index.astro     # Landing page
│   ├── layouts/            # Page templates
│   ├── lib/                # Core business logic
│   │   └── database/       # Database services and models
│   └── styles/             # SCSS modules and themes
├── prisma/                 # Database schema and migrations
└── public/                 # Static assets
```

---

## Security & Performance

### Security Features

- Clerk-based authentication with session management
- Comprehensive input validation and sanitization
- Prisma ORM with parameterized queries preventing SQL injection
- API rate limiting and abuse protection

### Performance Optimizations

- Astro's island architecture for selective hydration
- Strategic database indexing on business_impact_score and subreddit_id
- Multi-layer caching for frequently accessed data
- Bundle optimization with tree shaking and code splitting

---

## Contributing

1. Fork the repository and create a feature branch
2. Follow TypeScript best practices and existing component patterns
3. Test changes locally with `npm run dev`
4. Submit a pull request with clear description of changes

### Development Environment

```bash
git clone https://github.com/your-username/reddit-business-ideas-explorer.git
cd reddit-business-ideas-explorer
npm install
cp .env.example .env  # Configure with your credentials
npx prisma migrate dev
npm run dev
```

---

## Credits

**Backend & System Architecture**: [RuseCristian](https://github.com/RuseCristian) - Database design, API development, authentication implementation

**Frontend & User Experience**: [raduandreigorcea](https://github.com/raduandreigorcea) - React components, dashboard design, responsive UI/UX

**Data Processing**: See the [AI pipeline repository](https://github.com/RuseCristian/reddit-business-ideas-data-pipeline) for Reddit scraping and machine learning components.

## Application Gallery

### Landing & Authentication

<img src="https://github.com/user-attachments/assets/423b6b7a-c632-49b3-96c8-3b5d0ab4e558" alt="Landing Page" width="400"/> <img src="https://github.com/user-attachments/assets/d7d78751-cb85-4dda-9f59-774cb0e91086" alt="Authentication" width="400"/>
<img src="https://github.com/user-attachments/assets/88605543-ae4a-49c2-bd20-0bba39178bd3" alt="Dashboard Overview" width="400"/> <img src="https://github.com/user-attachments/assets/5fecee48-e020-40af-8c7f-463818528edb" alt="Quick Actions" width="400"/>

### Communities & Opportunities

<img src="https://github.com/user-attachments/assets/3c702978-c83f-45e4-a648-06c929fcfa10" alt="Communities" width="400"/> <img src="https://github.com/user-attachments/assets/d70f8293-2065-4403-803b-b3658c63d9cf" alt="Opportunities" width="400"/>

<img src="https://github.com/user-attachments/assets/3793064d-53d0-4cc3-9078-a29bcab41a9f" alt="Opportunity Grid" width="400"/>

### Detailed Analysis

<img src="https://github.com/user-attachments/assets/2e986efb-50fc-494f-a930-5e1f812fb316" alt="Business Analysis" width="400"/> <img src="https://github.com/user-attachments/assets/ee7f601f-3d0c-4a89-8a69-c9962d12f8a4" alt="Opportunity Details" width="400"/>
<img src="https://github.com/user-attachments/assets/393288d0-5b03-4934-b122-aa47a1f9abec" alt="Evidence Sources" width="400"/>
