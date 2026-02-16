# About the project

Zoho People AI is a persona-aware HR workspace that uses **agentic generative UI**: the AI does not invent new screens; it selects from **pre-registered, typed UI components** and **tools** to complete HR workflows (leave, attendance, approvals, policies, dashboards).

The UX is goal-first (intent → action), so employees, managers, and HR admins can complete tasks without hunting through module-heavy menus.

# Tech stack and architecture

**Tech stack**
- Next.js 15 (App Router) + React 19 + TypeScript
- Tambo (`@tambo-ai/react`) for intent → component/tool orchestration
- Tailwind CSS v4 + Radix UI primitives (via local `src/components/ui/*`)
- Recharts for charts/analytics visualizations
- Zod schemas for tool/component inputs (typed + validated payloads)
- Supabase for persistence + realtime updates
- Vitest for unit tests

**Architecture (high level)**
- **UI layer**: `ChatPage` + persona-aware layout renders the conversation and the selected HR components.
- **Persona/context layer**: `PersonaProvider` + `TamboWrapper` inject persona and runtime context into every interaction.
- **Generative UI registry**: `src/lib/tambo.ts` registers:
  - **Components** (renderable UI blocks)
  - **Tools** (structured actions that call backend services)
- **Backend/API layer**: Next.js API route(s) under `src/app/api/hr/*` provide a single HR action surface.
- **Service/data layer**: `hr-unified` delegates to Supabase modules under `src/services/supabase-hr/*`.
- **Realtime**: `use-realtime-hr` subscribes to Supabase changes and triggers refresh signals so components stay current.

# clean workflow

1. User selects a persona (Employee / Manager / HR Admin).
2. User expresses an intent in plain language (or uses a sidebar quick action).
3. Tambo classifies the intent using persona + context.
4. The app renders a **registered component** (forms, dashboards, approvals, charts) to capture structured inputs.
5. On submit, a **tool** runs (typed by Zod) and calls the HR API route.
6. The API route executes the requested operation via the unified service layer (Supabase-backed).
7. UI updates immediately and/or via realtime events to reflect the new state.

# Learning and growth (optional)

- Designing “bounded” generative UI: predictable output by restricting the model to registered components/tools.
- Building persona-first UX flows that reduce navigation and cognitive load.
- Creating reliable workflows by hardening components against undefined data and validating inputs.
- Improving data storytelling through cleaner, theme-aware visualizations.
