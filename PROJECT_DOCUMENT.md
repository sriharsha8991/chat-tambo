# Zoho People AI — Project Document

## About the Project

Zoho People AI is a **persona-aware, intent-driven HR workspace** that uses **agentic generative UI** to reimagine how employees, managers, and HR admins complete routine tasks.

The AI does not invent new screens — it selects from **19 pre-registered, typed UI components** and **11 tools** to complete HR workflows (leave, attendance, approvals, policies, dashboards). The UX is goal-first (intent → action), so users can complete tasks without hunting through module-heavy menus.

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15.5.7 (App Router) + React 19.1 + TypeScript |
| **AI Engine** | Tambo AI (`@tambo-ai/react`) for intent → component/tool orchestration |
| **Database** | Supabase (PostgreSQL + Realtime subscriptions) |
| **Styling** | Tailwind CSS v4 + Radix UI primitives |
| **Charts** | Recharts for data visualization |
| **Dashboard** | react-grid-layout for drag-and-drop widget positioning |
| **Validation** | Zod schemas for tool/component inputs |
| **Testing** | Vitest |

---

## Architecture

```
User Input → Persona Detection → Intent Understanding → Component Selection → Render → State Update
```

**Layer Design:**

| Layer | Purpose |
|-------|---------|
| UI Layer | Chat interface + pinnable dashboard + proactive alerts |
| AI Orchestration | TamboProvider with 4 context helpers (user, persona, time, permissions) |
| Component Registry | 19 registered components with Zod prop schemas |
| Tool System | 11 tools with Zod input/output schemas |
| API Layer | Single `/api/hr` endpoint with action-based dispatch (45 actions) |
| Service Layer | `hr-unified.ts` delegates to Supabase data modules |
| Realtime Layer | Singleton channel manager with ref-counting and 300ms debounce |

**Key Patterns:**
- Bounded generative UI — AI can only render pre-registered, tested components
- Single source of truth — unified component registry shared between AI and dashboard
- Root-level providers — persistent state across navigation
- Dual refresh — Supabase Realtime (cross-user) + local CustomEvent (immediate feedback)

---

## Personas

| Persona | User | Capabilities |
|---------|------|-------------|
| **Employee** | Priya Sharma (ZP-1001) | Check in/out, leave requests, attendance, regularization, salary slips |
| **Manager** | Rajesh Kumar (ZP-0501) | + Team overview, approval queue, approve/reject requests |
| **HR Admin** | Ananya Patel (ZP-0101) | + System dashboard, policy management, announcements, documents, analytics |

---

## Key Features

### 1. Generative UI
AI dynamically selects and renders from 19 pre-registered components based on user intent and persona. No free-form UI generation — safe, predictable, auditable.

### 2. Pinnable Dashboard
Pin any AI-rendered component to a persistent, drag-and-drop grid dashboard. Preset templates auto-seed widgets on first visit per persona.

### 3. Real-time Data
Singleton Supabase channel manager (one channel per table, ref-counted). 300ms debounced fan-out ensures responsive updates without overwhelming re-renders.

### 4. Proactive Intelligence
Context-aware alerts: missed checkout reminders, pending approval notifications, working hours status — all persona-specific.

### 5. Analytics
Real Supabase aggregation queries for attendance trends, leave analytics, team metrics, and HR analytics with date range filtering and chart-ready output.

### 6. Complete HR Workflows
- **Attendance:** Check in/out, attendance history, regularization requests
- **Leave:** Balance view, apply leave, track request status
- **Approvals:** Manager approval queue, approve/reject with comments
- **Policies:** Search, view, create/edit/delete (HR only)
- **Announcements:** Feed, pinned items, create/delete (HR only)
- **Documents:** Upload PDFs, acknowledgment tracking, manage (HR only)
- **Employee Directory:** Searchable, department-grouped employee viewer

---

## Database

10 PostgreSQL tables with 18 indexes, 5 update triggers, RLS policies, and 7 tables with Supabase Realtime enabled.

Core tables: `employees`, `attendance`, `leave_balances`, `leave_requests`, `regularization_requests`, `notifications`, `policies`, `announcements`, `documents`, `document_acknowledgments`, `pinned_widgets`.

---

## Demo Workflow

1. **Select a persona** from the top-right dropdown
2. **Ask a question** in natural language:
   - Employee: "Show my leave balance" → LeaveBalanceCard rendered
   - Manager: "Show my pending approvals" → ApprovalQueue rendered
   - HR: "Show the HR dashboard" → SystemDashboard rendered
3. **Pin components** to the dashboard for persistent monitoring
4. **Perform actions** directly from rendered components (check in, approve, apply leave)
5. **See real-time updates** as data changes across tabs and users

---

## Learning & Growth

- Designing **bounded generative UI**: predictable output by restricting the model to registered components/tools
- Building **persona-first UX flows** that reduce navigation and cognitive load
- Implementing **singleton realtime patterns** with ref-counting for efficient resource usage
- Creating **dual-registry systems** that serve both AI orchestration and dashboard rendering
- Real Supabase aggregation queries with **fallback mock data** for resilient analytics
- **Action-based API dispatch** consolidating 45 operations into a single endpoint

---

## Project Structure Summary

```
src/
├── app/            # Next.js pages + API routes
├── components/
│   ├── hr/         # 19 HR domain components (7 employee, 3 manager, 5 admin, 4 shared)
│   ├── layout/     # App shell, dashboard, proactive alerts
│   ├── tambo/      # Chat UI primitives
│   └── ui/         # Radix-based primitives
├── contexts/       # PersonaContext
├── hooks/          # useLiveQuery, usePinnedWidgets, useHRActions, useAsyncAction
├── lib/            # Tambo config, component registry, realtime manager, API client
├── services/       # API client, unified service, query resolver, Supabase modules
└── types/          # TypeScript domain types + database types
```

---

## How to Run

```bash
npm install
cp example.env.local .env.local
# Set NEXT_PUBLIC_TAMBO_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
# Run supabase/schema.sql and supabase/seed.sql in Supabase SQL editor
npm run dev
# Open http://localhost:3000
```
