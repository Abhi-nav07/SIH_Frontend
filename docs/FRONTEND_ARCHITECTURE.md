# SANKAT SETU — Frontend Architecture (Phase 1)

> Version: Phase 1 target state
> Last updated: 2026-09-01

---

## 1. High-level architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 16 App Router                    │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Root Layout  │  │  App Shell   │  │ Route Pages (6)      │  │
│  │ (metadata,   │→ │ (sidebar,    │→ │ / /tasks /intel      │  │
│  │  CSS, font)  │  │  mobile nav, │  │ /citizen /plan       │  │
│  │              │  │  status bar) │  │ /after               │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Component Library                        ││
│  │  ┌─────────┐ ┌────────┐ ┌────────────┐ ┌───────────────┐  ││
│  │  │ ui/     │ │layout/ │ │ domain/    │ │ feature/      │  ││
│  │  │ Badge   │ │AppShell│ │ StatCard   │ │ TaskBoard     │  ││
│  │  │ Button  │ │Sidebar │ │ RiskMap    │ │ DecisionPanel │  ││
│  │  │ Card    │ │PageHdr │ │ Timeline   │ │ CitizenPhone  │  ││
│  │  │ Toast   │ │        │ │ Charts     │ │ Copilot       │  ││
│  │  │ Skeleton│ │        │ │ Readiness  │ │ WhatIf        │  ││
│  │  │ Dialog  │ │        │ │            │ │               │  ││
│  │  └─────────┘ └────────┘ └────────────┘ └───────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     State & Logic Layer                     ││
│  │  ┌──────────────────┐  ┌──────────────────────────────┐    ││
│  │  │ Zustand Store    │  │ lib/intelligence/            │    ││
│  │  │ (scenario state, │  │ (snapshot builder, client,   │    ││
│  │  │  actions, tasks, │  │  local fallback, types)      │    ││
│  │  │  events, citizen)│  │                              │    ││
│  │  └──────────────────┘  └──────────────────────────────┘    ││
│  │  ┌──────────────────┐  ┌──────────────────────────────┐    ││
│  │  │ lib/scenario/    │  │ lib/providers/               │    ││
│  │  │ (risk, routing,  │  │ (mock + API provider for     │    ││
│  │  │  tasks, actions, │  │  future backend integration) │    ││
│  │  │  timeline, etc.) │  │                              │    ││
│  │  └──────────────────┘  └──────────────────────────────┘    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  API Routes                                                 ││
│  │  /api/intelligence/[...path] → proxy to Python V0.4 service ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## 2. Component classification

### `components/ui/` — Design-system primitives
Stateless, composable, no domain knowledge. Accept typed props and render consistently.
- `Badge`, `Button`, `Card`, `CardHeader`, `CardBody`
- NEW: `StatusIndicator`, `EmptyState`, `LoadingState`, `Skeleton`, `SectionHeader`, `Metric`, `Tooltip`, `Tabs`, `FilterChip`, `SearchField`, `ConfirmDialog`, `Toast`, `Progress`

### `components/layout/` — Shell and navigation
- `AppShell`, `Sidebar`, `PageHeader`

### `components/command/` — Command Center page components
- `StatCard` → should move to `components/ui/`
- `DecisionPanel`, `TimelinePanel`

### `components/tasks/` — Action Board page components
- `TaskBoard`, `TaskCard`, `EscalationFeed`

### `components/intelligence/` — Decision Intelligence page components
- `IntelligenceWorkbench` → should split into `CopilotPanel`, `CommandBrief`, `WhatIfSimulator`

### `components/citizen/` — Citizen Alert page components
- `CitizenPhone`

### `components/map/` — Operational map
- `RiskMap`

### `components/after/` — After-Action page components
- `AfterActionCharts`

### `components/plan/` — Living DDMP page components
- `ReadinessPanel`

## 3. Design token system

All tokens are defined as CSS custom properties in `globals.css` and consumed by Tailwind v4's `@theme` directive.

```
Color tokens:
  --color-canvas        #050b14       Page background
  --color-panel         #0a1422       Card/panel background
  --color-surface       #0d1928       Elevated surface
  --color-overlay       #07111f       Overlay/sidebar bg
  --color-line          white/7.5%    Default border
  --color-line-hover    white/12%     Hover border

Status colors (semantic):
  --color-critical      red-500       Danger/critical
  --color-warning       amber-500     Watch/warning
  --color-success       emerald-500   Safe/completed
  --color-info          cyan-500      Information
  --color-neutral       slate-500     Inactive

Text hierarchy:
  --text-heading        white
  --text-primary        slate-200
  --text-secondary      slate-400
  --text-muted          slate-500
  --text-faint          slate-600

Spacing:
  --space-section       1.5rem        Gap between page sections
  --space-card          1rem          Internal card padding

Typography:
  --font-display        Inter, system-ui
  --text-overline       10px, 700, uppercase, tracking 0.14em
  --text-label          11px, 600
  --text-body           14px, 400
  --text-title          24px/30px, 900
```

## 4. State management architecture

### Zustand store (`lib/scenario/store.ts`)
Single store for scenario domain state. No UI state stored here.

**Selectors pattern:**
```typescript
// Focused selectors — each component subscribes only to what it needs
const phase = useScenarioStore(s => s.phase);
const tasks = useScenarioStore(s => s.tasks);
```

**Derived state** (computed outside the store):
```typescript
// lib/scenario/selectors.ts
export const selectPendingCount = (tasks: Task[]) => tasks.filter(t => t.status === "pending").length;
export const selectPopulationAtRisk = (villages: Village[]) => villages.filter(v => v.status !== "safe").reduce((sum, v) => sum + v.population, 0);
```

### Local component state
- Filter selections (TaskBoard)
- Search queries (TaskBoard)
- Open/closed panels
- Form inputs (Intelligence question)
- What-if selection
- Toast queue

## 5. Page architecture pattern

Every page follows this structure:
```
<PageHeader eyebrow title description actions />
<StatusBar /> (optional — exercise phase alerts)
<MetricsRow /> (StatCard grid)
<PrimaryContent /> (main operational content)
<SecondaryContent /> (sidebar, supplementary info)
```

## 6. Responsive breakpoints

| Breakpoint | Target | Layout |
|------------|--------|--------|
| < 640px | Mobile (360–639px) | Single column, bottom nav, stacked cards |
| 640–767px | Large mobile | Minor spacing adjustments |
| 768–1023px | Tablet | 2-column grids, bottom nav still visible |
| 1024–1439px | Laptop | Sidebar visible, 2-column layouts |
| ≥ 1440px | Desktop | Full sidebar, 3-column layouts where applicable |

## 7. Accessibility architecture

- Skip-to-content link in `AppShell`
- Landmark regions: `<nav>`, `<main>`, `<aside>`
- Heading hierarchy: `<h1>` per page (PageHeader), `<h2>` in cards, `<h3>` for sub-sections
- `aria-current="page"` on active nav links
- `aria-live="polite"` region for status announcements (exercise state, escalation)
- `aria-pressed` on filter toggles
- `role="list"` on timeline events
- `aria-label` on SVG map and charts
- Focus management: `focus-visible:ring` on all interactive elements
- Reduced motion: `prefers-reduced-motion` media query (already present)

## 8. Error handling strategy

| Layer | Strategy |
|-------|----------|
| Intelligence service | Try service → catch → local fallback → show "offline" badge |
| Page rendering | Components handle empty arrays gracefully with EmptyState |
| Store actions | Pure functions, no network calls, deterministic |
| Report export | Try/catch around blob creation + toast feedback |

## 9. File organization (target state)

```
app/
  globals.css              ← Design tokens + base styles
  layout.tsx               ← Root layout (Server Component)
  page.tsx                 ← Command Center
  tasks/page.tsx           ← Action Board
  intelligence/page.tsx    ← Decision Intelligence
  citizen/page.tsx         ← Citizen Alert
  plan/page.tsx            ← Living DDMP
  after/page.tsx           ← After-Action
  api/intelligence/        ← Proxy route

components/
  ui/                      ← Design-system primitives
  layout/                  ← Shell + navigation
  command/                 ← Command Center features
  tasks/                   ← Action Board features
  intelligence/            ← Decision Intelligence features
  citizen/                 ← Citizen Alert features
  map/                     ← Operational map
  plan/                    ← Living DDMP features
  after/                   ← After-Action features

lib/
  scenario/                ← Domain logic (risk, routing, tasks, etc.)
  intelligence/            ← Intelligence client + fallback
  providers/               ← Data provider abstraction (V0.3)
  utils.ts                 ← Shared utilities
```
