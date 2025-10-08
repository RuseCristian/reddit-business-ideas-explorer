# Reddit Business Ideas Explorer - Web Application

> **📋 This is Part 1 of 2 - Complete System Overview**  
> This repository contains the **web application frontend and APIs**. The complete system also includes:  
> **🔗 [Data Processing Pipeline →](https://github.com/RuseCristian/reddit-business-ideas-data-pipeline)** _(Python scripts for Reddit data analysis)_

A web application that displays business opportunities discovered from Reddit discussions. Instead of manually browsing through hundreds of posts, this system processes discussions from business-focused subreddits, identifies patterns in problems people are discussing, and presents them as potential business opportunities with impact scores.

![Reddit Business Ideas Explorer](https://img.shields.io/badge/Status-Active-brightgreen)
![Astro](https://img.shields.io/badge/Astro-5.13.9-orange)
![React](https://img.shields.io/badge/React-19.1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Enabled-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.16.2-blueviolet)

## System Architecture

This web application consumes data processed by our **separate Python data pipeline**:

1. **Data Pipeline** ([Repository →](https://github.com/RuseCristian/reddit-business-ideas-data-pipeline)): Reddit scraping → LLM processing → Business opportunity extraction → Database storage
2. **Web Application** (this repo): Database queries → API responses → User interface → Bookmarking system

## What This App Does

**Browse Opportunities**: View business opportunities discovered from Reddit discussions, scored by commercial potential

**Community Analysis**: Explore different subreddits (r/entrepreneur, r/startups, etc.) with opportunity counts and stats

**Search & Filter**: Find specific problem types, filter by subreddit, sort by business impact score

**User Features**: Sign up to bookmark interesting opportunities and track browsing history

## Tech Stack

- **Frontend**: Astro + React + TypeScript + Sass
- **Backend**: Node.js with API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Deployment**: Vercel/Netlify ready

## Quick Start

**Prerequisites**: Node.js 18+, PostgreSQL, Clerk account

```bash
git clone https://github.com/RuseCristian/reddit-business-ideas-explorer.git
cd reddit-business-ideas-explorer
npm install
npx prisma generate
npm run dev
```

**Environment setup** (`.env`):

```env
# Database (must be populated by data pipeline first)
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

**Database setup**:

```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Create database schema
npm run dev          # Start development server
```

Open http://localhost:4321

## Key Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run db:studio    # Database admin interface
npm run db:reset     # Reset database (careful!)
```

## Important Note

This web app **displays** opportunities but doesn't generate them. To populate the database with actual opportunities, you need to run the **data processing pipeline** first:

**🔗 [Data Pipeline Repository →](https://github.com/RuseCristian/reddit-business-ideas-data-pipeline)**

## Contributing

Fork, make changes, open a PR. No formal process needed.

## Credits

**Backend & APIs**: [RuseCristian](https://github.com/RuseCristian) - Database design, API development, system architecture

**Frontend & UI**: [raduandreigorcea](https://github.com/raduandreigorcea) - React components, dashboard design, user interface

**Data Processing**: See the [data pipeline repository](https://github.com/RuseCristian/reddit-business-ideas-data-pipeline) for Reddit scraping and AI analysis components.
