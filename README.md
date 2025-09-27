# Reddit Business Ideas Explorer

An Astro + Prisma starter that highlights community-sourced business experiments. The project renders marketing content alongside live data pulled from a PostgreSQL database using Prisma ORM.

## Prerequisites

- Node.js 18 or newer
- A PostgreSQL database (or Prisma Postgres project)

## Setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Configure environment variables by copying the example file and filling in your database credentials:

   ```powershell
   Copy-Item .env.example .env
   ```

   Update `DATABASE_URL` (and optionally `PRISMA_ACCELERATE_URL` if you're using Prisma Accelerate).

3. Apply the Prisma migrations and generate the Prisma Client:

   ```powershell
   npx prisma migrate deploy
   npx prisma generate
   ```

4. (Optional) Seed the database with sample users and posts:

   ```powershell
   npx prisma db seed
   ```

5. Start the development server:

   ```powershell
   npm run dev
   ```

   The app serves dynamic data at [`/api/users`](http://localhost:4321/api/users) and renders it on the homepage in the "Community Builders" section.

## Prisma Workflow

- Update the Prisma schema in `prisma/schema.prisma` to evolve your models.
- Create new migrations as needed:

   ```powershell
   npx prisma migrate dev --name <migration-name>
   ```

- Inspect your data with Prisma Studio:

   ```powershell
   npx prisma studio
   ```

## Project Structure Highlights

- `src/lib/prisma.ts` – Prisma Client singleton with optional Accelerate support.
- `src/pages/api/users.ts` – Astro API route that returns users with their posts.
- `src/sections/UsersSection.astro` – Homepage section that renders the Prisma-backed data.
- `prisma/seed.ts` – Seed script that populates sample records.

Feel free to expand the schema, add authenticated routes, or wire the data into additional UI components to grow the explorer.
