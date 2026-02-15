# Setup & Deployment Guide

> Complete guide for setting up, configuring, and deploying Zoho People AI.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Tambo AI Setup](#tambo-ai-setup)
- [Development Workflow](#development-workflow)
- [Production Build](#production-build)
- [Deployment Options](#deployment-options)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 18.17+ | JavaScript runtime |
| npm | 9+ | Package manager |
| Git | Latest | Version control |
| Supabase Account | Free tier | Database + Realtime |
| Tambo AI API Key | — | AI orchestration |

---

## Local Development Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd chat-tambo
npm install
```

### 2. Configure Environment

```bash
cp example.env.local .env.local
```

Edit `.env.local` — see [Environment Variables](#environment-variables) below.

### 3. Set Up Database

Follow the [Supabase Setup](#supabase-setup) section to create tables and seed data.

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Create `.env.local` in the project root:

```env
# Required — Tambo AI
NEXT_PUBLIC_TAMBO_API_KEY=your-tambo-api-key

# Required — Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional — Custom Tambo endpoint
NEXT_PUBLIC_TAMBO_URL=https://custom-tambo-url.com
```

### Variable Details

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_TAMBO_API_KEY` | Yes | API key from [tambo.co](https://tambo.co). Used for AI intent resolution and component/tool orchestration. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL (e.g., `https://abc123.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous (public) key. Found in Project Settings → API. |
| `NEXT_PUBLIC_TAMBO_URL` | No | Override default Tambo API endpoint. Only needed for self-hosted Tambo. |

> **Note:** All variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never put secret keys here.

---

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project — choose any region
3. Note your project URL and anon key from **Settings → API**

### 2. Run the Schema

Open the **SQL Editor** in your Supabase dashboard and execute:

```sql
-- Copy and paste the contents of: supabase/schema.sql
```

This creates:

| Table | Description |
|-------|-------------|
| `employees` | Employee profiles with roles and departments |
| `attendance` | Daily check-in/check-out records |
| `leave_balances` | Leave type allocations per year |
| `leave_requests` | Leave applications with approval status |
| `regularization_requests` | Attendance correction requests |
| `notifications` | In-app notification system |
| `policies` | HR policy documents |
| `announcements` | Company announcements |
| `documents` | Uploaded documents (PDFs) |
| `document_acknowledgments` | Document read confirmations |
| `pinned_widgets` | Dashboard widget persistence |

Plus 18 indexes, 5 update triggers, and RLS policies.

### 3. Seed Demo Data

Execute in the SQL Editor:

```sql
-- Copy and paste the contents of: supabase/seed.sql
```

This inserts:

| Data | Count |
|------|-------|
| Employees | 7 (1 HR, 1 Manager, 5 Employees) |
| Leave Balances | 30 (5 types × 6 employees) |
| Attendance Records | Sample records |
| Policies | 3 (Leave, Attendance, WFH) |
| Announcements | 2 sample announcements |

### 4. Enable Realtime

The schema automatically adds these tables to Supabase Realtime:

- `leave_requests`
- `regularization_requests`
- `notifications`
- `attendance`
- `announcements`
- `documents`
- `document_acknowledgments`

Verify in **Database → Replication** that these tables are listed.

### 5. Verify Setup

Start the dev server and check:

```bash
# In the browser console or via the app
GET /api/hr?action=getBackendType
# Should return: { "backend": "supabase" }

GET /api/hr?action=getAllEmployees
# Should return 7 employees
```

### Demo Users (Seeded)

| Name | Employee ID | Role | Email |
|------|-------------|------|-------|
| Ananya Patel | ZP-0101 | HR Admin | ananya.patel@company.com |
| Rajesh Kumar | ZP-0501 | Manager | rajesh.kumar@company.com |
| Priya Sharma | ZP-1001 | Employee | priya.sharma@company.com |
| Amit Patel | ZP-1002 | Employee | amit.patel@company.com |
| Sneha Reddy | ZP-1003 | Employee | sneha.reddy@company.com |
| Vikram Singh | ZP-1004 | Employee | vikram.singh@company.com |
| Kavitha Nair | ZP-1005 | Employee | kavitha.nair@company.com |

---

## Tambo AI Setup

### 1. Get an API Key

1. Sign up at [tambo.co](https://tambo.co)
2. Create a new project
3. Copy the API key

### 2. Configure

Add to `.env.local`:

```env
NEXT_PUBLIC_TAMBO_API_KEY=your-api-key-here
```

### 3. Verify

Start the app and send a message in the chat. The AI should respond and render components based on your intent.

### How Tambo Works in This App

1. **TamboProvider** wraps the app with API key, registered components, and tools
2. **Context helpers** inject user identity, persona, time, and permissions into every AI interaction
3. **Components** (19) are registered with descriptions and Zod prop schemas
4. **Tools** (11) are registered with Zod input/output schemas
5. When the user sends a message, Tambo AI:
   - Resolves intent using persona + context
   - Selects appropriate tool(s) to call
   - Selects a component to render
   - Validates data through Zod schemas
   - Renders the component inline in the chat

---

## Development Workflow

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload (port 3000) |
| `npm run build` | Production build with optimizations |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint checks |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run test` | Run Vitest test suite |
| `npm run test:watch` | Run tests in watch mode |

### Development Tips

**Adding a new component:**
1. Create in `src/components/hr/{persona}/`
2. Export from barrel files (`index.ts`)
3. Register in `src/lib/component-registry.ts`
4. Add to `src/lib/tambo.ts` components array with prop schema

**Adding a new tool:**
1. Implement in `src/services/hr-api-client.ts`
2. Add backend handler in `src/app/api/hr/route.ts`
3. Add service function in `src/services/hr-unified.ts`
4. Register in `src/lib/tambo.ts` tools array with input/output schemas

**Adding a new query:**
1. Add handler in `src/services/query-resolver.ts`
2. Map to service function
3. Add table mapping for realtime subscriptions

### File Upload

Documents uploaded via DocumentCenter are saved to `public/uploads/`. Ensure this directory exists and is writable:

```bash
mkdir -p public/uploads
```

---

## Production Build

### Build

```bash
npm run build
```

Expected output:

```
Route (app)                    Size     First Load JS
┌ ○ /                          ...      ~1.22 MB
├ ○ /chat                      ...      ~1.21 MB
├ ○ /dashboard                 ...      ~1.23 MB
├ ƒ /api/hr                    ...
├ ƒ /api/hr/upload             ...
└ ƒ /api/query                 ...
```

### Run Production Server

```bash
npm run start
```

---

## Deployment Options

### Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

**Notes:**
- API routes run as Serverless Functions
- File uploads (`public/uploads/`) won't persist — use Supabase Storage or S3 instead
- Set Node.js runtime to 18+

### Docker (Self-Hosted)

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN mkdir -p public/uploads && chown -R nextjs:nodejs public/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

Add to `next.config.ts`:

```typescript
const nextConfig = {
  output: "standalone",
};
```

Build and run:

```bash
docker build -t zoho-people-ai .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_TAMBO_API_KEY=your-key \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  zoho-people-ai
```

### Node.js Server

```bash
npm run build
NODE_ENV=production npm run start
```

Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start npm --name "zoho-people-ai" -- start
```

---

## Troubleshooting

### Common Issues

#### "Supabase not configured"

**Cause:** Missing or incorrect `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

**Fix:** Verify `.env.local` has both variables set correctly. Restart the dev server after changes.

#### "Failed to fetch" in the UI

**Cause:** API route errors, often from missing Supabase tables.

**Fix:**
1. Check browser DevTools → Network tab for the failing request
2. Check terminal for server-side error logs
3. Verify Supabase schema was fully executed
4. Test API directly: `GET /api/hr?action=getBackendType`

#### Chat doesn't respond

**Cause:** Invalid or missing Tambo API key.

**Fix:** Verify `NEXT_PUBLIC_TAMBO_API_KEY` is set and valid. Check browser console for Tambo errors.

#### Realtime not updating

**Cause:** Tables not added to Supabase Realtime publication.

**Fix:**
1. Go to Supabase Dashboard → Database → Replication
2. Verify the 7 tables are listed in the publication
3. If missing, run:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE leave_requests, regularization_requests, notifications, attendance, announcements, documents, document_acknowledgments;
   ```

#### Dashboard empty after persona switch

**Cause:** No pinned widgets and preset seeding hasn't triggered.

**Fix:** This is expected behavior — presets seed on first visit. Try refreshing the page or clicking "Refresh All" in the dashboard header. Preset seeding runs once per session.

#### TypeScript errors after changes

**Fix:**
```bash
npm run lint:fix
# Verify with:
npm run build
```

### Useful Debug Check Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/hr?action=getBackendType` | Verify Supabase connection |
| `GET /api/hr?action=getAllEmployees` | Verify seed data |
| `GET /api/hr?action=getSystemMetrics` | Verify aggregation queries |
| `GET /api/hr?action=getPolicies` | Verify policy data |

### Performance Debugging

Check active realtime channels in browser console:

```javascript
// Import in component or console
import { activeChannelCount } from "@/lib/realtime-manager";
console.log("Active channels:", activeChannelCount());
```

Expected: 1 channel per subscribed table (max 7).
