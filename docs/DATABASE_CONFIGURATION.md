# Database Configuration Guide

## Overview

DailyUse uses **Neon PostgreSQL** as the primary database for development and production. Neon provides a serverless PostgreSQL database with a generous free tier.

## Quick Start

### 1. Neon PostgreSQL Setup (Recommended)

**Sign up**: [https://neon.tech](https://neon.tech)

**Free Tier Limits**:
- 0.5 GB storage
- 10 GB data transfer/month
- Unlimited projects
- Autosuspend after 5 minutes of inactivity

**Connection String Format**:
```
postgresql://USER:PASSWORD@HOST.neon.tech/DATABASE?sslmode=require
```

### 2. Environment Configuration

**Root `.env` file** (`/dailyuse/.env`):
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@YOUR_HOST.neon.tech/dailyuse?sslmode=require"
```

**API `.env` file** (`/apps/api/.env`):
```env
PORT=3888
DB_PROVIDER="postgresql"
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@YOUR_HOST.neon.tech/dailyuse?sslmode=require"

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:5174

# JWT
JWT_SECRET=dev-access-secret
REFRESH_TOKEN_SECRET=dev-refresh-secret
```

⚠️ **Important**: Both files need `DATABASE_URL` because:
- Root `.env`: Used by Prisma CLI commands from root
- `apps/api/.env`: Used by the API server at runtime

## Prisma Commands

**Always run from root directory** (packages are in root `node_modules`):

```bash
# Generate Prisma Client
pnpm prisma:generate

# Push schema to database (development)
pnpm db:push

# Create and apply migration (production)
pnpm prisma:migrate

# Open Prisma Studio (database GUI)
pnpm prisma:studio

# Seed database with test data
pnpm db:seed

# Reset database (DANGEROUS!)
pnpm prisma:reset
```

## Common Issues

### Issue 1: `Environment variable not found: DATABASE_URL`

**Cause**: Missing `.env` file in root directory

**Solution**:
```bash
# Create root .env file
cp apps/api/.env .env
```

### Issue 2: `Cannot find module 'prisma'`

**Cause**: Trying to run Prisma from `apps/api` directory

**Solution**: 
```bash
# ❌ Wrong
cd apps/api && pnpm prisma db push

# ✅ Correct
pnpm db:push  # from root
```

### Issue 3: Connection timeout to Neon

**Causes**:
1. Network firewall blocking PostgreSQL port (5432)
2. Invalid connection string
3. Database suspended (Neon auto-suspends after 5 min)

**Solutions**:
```bash
# Test connection with psql
psql 'postgresql://USER:PASSWORD@HOST.neon.tech/DATABASE?sslmode=require'

# Check Prisma connection
pnpm prisma db execute --stdin <<< "SELECT 1;"
```

## Alternative: Local PostgreSQL

If you prefer local development:

### Using Docker

```bash
# Start PostgreSQL container
docker run -d \
  --name dailyuse-postgres \
  -e POSTGRES_DB=dailyuse \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15-alpine

# Update .env
DATABASE_URL="postgresql://admin:password@localhost:5432/dailyuse?schema=public"
```

### Using Local Installation

**Windows**: [PostgreSQL Installer](https://www.postgresql.org/download/windows/)

**macOS**: 
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux**:
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Create Database**:
```sql
CREATE DATABASE dailyuse;
CREATE USER admin WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE dailyuse TO admin;
```

## Database Schema

Current schema includes:

### Core Entities
- **User**: Authentication and profile
- **Goal**: OKR-style goals with time periods
- **KeyResult**: Measurable outcomes for goals
- **KeyResultWeightSnapshot**: Historical weight changes (Sprint 2a)

### Relationships
```
User (1) ──< (N) Goal
Goal (1) ──< (N) KeyResult
KeyResult (1) ──< (N) KeyResultWeightSnapshot
```

## Migrations

**Development**: Use `db:push` for rapid iteration
```bash
# Push schema changes without creating migration file
pnpm db:push
```

**Production**: Use `prisma:migrate` for tracked changes
```bash
# Create migration
pnpm prisma:migrate

# Deploy to production
pnpm prisma:migrate:deploy
```

## Prisma Studio

Visual database editor:

```bash
# Start Prisma Studio
pnpm prisma:studio

# Open in browser
http://localhost:5555
```

## Security Best Practices

1. **Never commit `.env` files** (already in `.gitignore`)
2. **Use different credentials for prod/dev**
3. **Rotate secrets regularly**
4. **Enable SSL/TLS** (required for Neon)
5. **Use connection pooling** (Neon provides pooler endpoint)

## Neon-Specific Features

### Connection Pooling

Neon provides two endpoints:

**Direct Connection** (for migrations):
```
ep-dry-bar-a18hfly2.ap-southeast-1.aws.neon.tech
```

**Pooled Connection** (for app, recommended):
```
ep-dry-bar-a18hfly2-pooler.ap-southeast-1.aws.neon.tech
```

Use pooled connection in production for better performance.

### Autosuspend

Neon suspends compute after 5 minutes of inactivity (free tier). First query after suspension takes ~1-2 seconds to "wake up" the database.

**In production**: Disable autosuspend or use paid tier.

### Branching (Pro Feature)

Neon supports database branching like Git:

```bash
# Create branch for feature development
neonctl branches create --project-id YOUR_PROJECT_ID

# Point to branch database
DATABASE_URL="postgresql://...@branch-name.neon.tech/..."
```

## Monitoring

**Neon Dashboard**: [https://console.neon.tech](https://console.neon.tech)

Metrics available:
- Storage usage
- Data transfer
- Active connections
- Query performance
- Compute time

## Backup & Restore

Neon automatically creates backups every 24 hours (retained for 7 days on free tier).

**Manual backup**:
```bash
# Export schema and data
pg_dump 'postgresql://USER:PASSWORD@HOST.neon.tech/DATABASE' > backup.sql

# Restore
psql 'postgresql://USER:PASSWORD@HOST.neon.tech/DATABASE' < backup.sql
```

## Troubleshooting

### Check Current Connection

```bash
pnpm prisma db execute --stdin <<< "SELECT version();"
```

### View All Tables

```bash
pnpm prisma db execute --stdin <<< "SELECT tablename FROM pg_tables WHERE schemaname='public';"
```

### Clear Cache

```bash
# Remove Prisma cache
rm -rf node_modules/.prisma

# Regenerate client
pnpm prisma:generate
```

## References

- [Neon Documentation](https://neon.tech/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Last Updated**: 2024-10-22  
**Maintainer**: Development Team
