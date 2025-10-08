# Reddit Business Ideas Explorer - Web Application

> **This is Part 1 of 2 - Complete System Overview**  
> This repository contains the **web application frontend and APIs**. The complete system also includes:  
> **[Data Processing Pipeline →](https://github.com/RuseCristian/reddit-business-ideas-data-pipeline)** _(Python scripts for Reddit data analysis)_

A web application that displays business opportunities discovered from Reddit discussions. Instead of manually browsing through hundreds of posts, this system processes discussions from business-focused subreddits, identifies patterns in problems people are discussing, and presents them as potential business opportunities with impact scores.

![Reddit Business Ideas Explorer](https://img.shields.io/badge/Status-Active-brightgreen)
![Astro](https://img.shields.io/badge/Astro-5.13.9-orange)
![React](https://img.shields.io/badge/React-19.1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Enabled-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.16.2-blueviolet)

<div align="center">
  <img src="https://github.com/user-attachments/assets/423b6b7a-c632-49b3-96c8-3b5d0ab4e558" alt="Reddit Business Ideas Explorer Dashboard" width="700"/>
</div>

## System Architecture

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

## Available Scripts

```bash
npm run dev          # Development server (localhost:4321)
npm run build        # Production build
npm run preview      # Preview production build
npm run db:studio    # Database admin interface
npm run db:push      # Push schema changes
npm run db:reset     # Reset database (careful!)
```

## Important Note

This web app **displays** opportunities but doesn't generate them. To populate the database with actual opportunities, you need to run the **data processing pipeline** first:

**[Data Pipeline Repository →](https://github.com/RuseCristian/reddit-business-ideas-data-pipeline)**

## Contributing

Fork, make changes, open a PR. No formal process needed.

## Credits

**Backend & APIs**: [RuseCristian](https://github.com/RuseCristian) - Database design, API development, system architecture

**Frontend & UI**: [raduandreigorcea](https://github.com/raduandreigorcea) - React components, dashboard design, user interface

**Data Processing**: See the [data pipeline repository](https://github.com/RuseCristian/reddit-business-ideas-data-pipeline) for Reddit scraping and AI analysis components.

---

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
