# 🚀 Production Deployment Guide

This guide covers deploying your secure Reddit Business Ideas Explorer to production with Neon PostgreSQL and Clerk authentication.

## 📋 Pre-Deployment Checklist

### 1. Database Setup (Neon PostgreSQL)

- [ ] Create Neon project at [console.neon.tech](https://console.neon.tech/)
- [ ] Copy connection string from Neon dashboard
- [ ] Set `DATABASE_URL` in production environment
- [ ] Test connection: `npm run db:generate && npm run db:push`

### 2. Authentication Setup (Clerk)

- [ ] Create Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com/)
- [ ] Configure authentication methods (email, social, etc.)
- [ ] Set production domain in Clerk dashboard
- [ ] Copy production keys: `CLERK_SECRET_KEY` and `PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] Configure user roles and permissions in Clerk

### 3. Basic Configuration

- [ ] Generate secure `JWT_SECRET` (32+ characters)
- [ ] Generate secure `ENCRYPTION_KEY` (32 characters exactly)
- [ ] Configure CORS origins for your domain
- [ ] Enable HTTPS enforcement

## 🌐 Deployment Platforms

### Vercel (Recommended)

#### 1. Connect Repository

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project directory
vercel

# Follow prompts to connect your GitHub/GitLab repo
```

#### 2. Environment Variables

Add these in Vercel dashboard (Settings → Environment Variables):

```bash
# Required
DATABASE_URL=postgresql://...neon.tech/...
CLERK_SECRET_KEY=your_clerk_secret_key
PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NODE_ENV=production

# Optional but recommended
JWT_SECRET=your-secure-jwt-secret
API_BASE_URL=https://yourdomain.vercel.app
CORS_ORIGINS=https://yourdomain.vercel.app
```

#### 3. Vercel Configuration

Create `vercel.json`:

```json
{
	"builds": [
		{
			"src": "package.json",
			"use": "@vercel/node"
		}
	],
	"functions": {
		"src/pages/api/**/*.{js,ts}": {
			"maxDuration": 30
		}
	},
	"headers": [
		{
			"source": "/api/(.*)",
			"headers": [
				{
					"key": "X-Content-Type-Options",
					"value": "nosniff"
				},
				{
					"key": "X-Frame-Options",
					"value": "DENY"
				},
				{
					"key": "X-XSS-Protection",
					"value": "1; mode=block"
				}
			]
		}
	]
}
```

### Netlify

#### 1. Build Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/api/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

#### 2. Environment Variables

Set in Netlify dashboard (Site settings → Environment variables):

- Same variables as Vercel above

### Railway

#### 1. Railway Configuration

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

#### 2. Environment Variables

Set in Railway dashboard or via CLI:

```bash
railway variables set DATABASE_URL=postgresql://...
railway variables set CLERK_SECRET_KEY=your_clerk_secret_key
railway variables set PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## 🗄️ Database Migration

### Initial Setup

```bash
# Generate Prisma client for production
npm run db:generate

# Deploy schema to production database
npm run db:push

# Or use migrations (recommended for production)
npx prisma migrate deploy
```

### Data Seeding (Optional)

```bash
# Create seed script if you have initial data
npx prisma db seed
```

## 🔒 Security Hardening

### 1. Environment Variables

Never commit these to version control:

```bash
# Add to .gitignore
.env
.env.local
.env.production
```

### 2. Security Headers

Ensure these headers are set (handled by api-guards.ts):

- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy`

### 3. Rate Limiting

Configure appropriate limits in production:

```bash
RATE_LIMIT_PUBLIC_REQUESTS=100
RATE_LIMIT_AUTH_REQUESTS=200
RATE_LIMIT_ADMIN_REQUESTS=1000
```

## 🧪 Testing Production Setup

### 1. Database Connection Test

```bash
# Test database connectivity
npm run db:generate
npx prisma db pull  # Should succeed without errors
```

### 2. Manual Testing Checklist

- [ ] Public pages load correctly
- [ ] Authentication flow works
- [ ] Database queries execute successfully
- [ ] HTTPS is enforced

## 📊 Monitoring & Observability

### 1. Application Monitoring

```bash
# Optional: Add Sentry for error tracking
npm install @sentry/node
```

### 2. Database Monitoring

- Monitor connection pool usage in Neon dashboard
- Set up alerts for high latency or connection errors
- Regular database performance reviews

### 3. Security Monitoring

- Review Clerk authentication logs
- Monitor rate limiting metrics
- Set up alerts for failed authentication attempts

## 🔄 CI/CD Setup

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
      - name: Build Project
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check environment variables
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Regenerate client if needed
npm run db:generate
```

#### Authentication Issues

```bash
# Verify Clerk configuration
# Check public key format (starts with pk_)
# Check secret key format (starts with sk_)
# Ensure domain is configured in Clerk dashboard
```

#### Rate Limiting Too Strict

```bash
# Adjust in production environment
RATE_LIMIT_PUBLIC_REQUESTS=200
RATE_LIMIT_PUBLIC_WINDOW=900000  # 15 minutes
```

### Performance Issues

- Enable database connection pooling in Neon
- Monitor API response times
- Consider adding Redis for advanced caching
- Optimize database queries (add indexes if needed)

## 📚 Documentation Links

- [Neon PostgreSQL Documentation](https://neon.tech/docs)
- [Clerk Authentication Documentation](https://clerk.com/docs)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/)

## 📞 Support

If you encounter issues during deployment:

1. Check the troubleshooting section above
2. Review logs in your deployment platform
3. Verify all environment variables are set correctly
4. Test API endpoints individually
5. Check database connectivity and migrations

Remember to never share production credentials or commit them to version control!
