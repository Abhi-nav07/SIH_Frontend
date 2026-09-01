# SANKAT SETU — Frontend Audit (Phase 1)

> Audit date: 2026-09-01
> Scope: Every file under `app/`, `components/`, `lib/`, `shared/`, `globals.css`, `package.json`, `tsconfig.json`

---

## 1. Oversized components

| Component | Lines | Issue |
|-----------|-------|-------|
| `IntelligenceWorkbench.tsx` | 262 | Monolithic: copilot Q&A, what-if simulator, command brief, local fallback logic — all in one file. Contains two 40+ line local functions (`localCompare`, `localCopilot`) that are business logic, not UI. |
| `app/page.tsx` (Command Center) | 114 | Inline alert banner (~30 lines), stat grid, map section, decision panel wiring — borderline but manageable after extracting the alert card. |
| `app/after/page.tsx` | 99 | Download handler + large inline JSX for event chronology and learning signals. Very dense single-line JSX that is hard to maintain. |
| `app/citizen/page.tsx` | 75 | Feature cards and response list are inline. Could extract `FeatureGrid` and `ResponseList`. |
| `CitizenPhone.tsx` | 81 | Acceptable size but has two distinct render branches (no-instruction vs. instruction) that could be split. |

### Recommendation
Extract `localCompare`, `localCopilot`, `WHAT_IF_OPTIONS`, `QUICK_QUESTIONS`, and `SUMMARY_FIELDS` from `IntelligenceWorkbench.tsx` into `lib/intelligence/localFallback.ts` and `lib/intelligence/config.ts`. Split the workbench into `CopilotPanel`, `CommandBrief`, and `WhatIfSimulator` sub-components.

---

## 2. Duplicated Tailwind classes

| Pattern | Occurrences | Files |
|---------|-------------|-------|
| `text-[10px] font-bold uppercase tracking-[0.12em+] text-slate-500/600` | 15+ | StatCard, PageHeader, Sidebar, TimelinePanel, DecisionPanel, CitizenPhone, plan page, after page |
| `rounded-xl border border-white/7 bg-white/[0.025] p-4` | 10+ | citizen page, plan page, after page, DecisionPanel, EscalationFeed |
| `grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300` | 5+ | tasks page, citizen page, plan page |
| `text-[9px] font-bold uppercase tracking-wider text-slate-600` | 8+ | DecisionPanel, IntelligenceWorkbench, after page |
| `border-b border-white/7 pb-4` | Every CardHeader usage |
| `text-xs font-bold text-slate-200/300` | Throughout |

### Recommendation
Create utility class tokens or shared Tailwind `@apply` composites for: `.label-overline`, `.surface-inset`, `.icon-container`, `.section-label`. Or better: build these into the design-system component library (SectionHeader, Metric, StatusIndicator).

---

## 3. Mixed business logic and presentation logic

| File | Business logic embedded in UI |
|------|------------------------------|
| `IntelligenceWorkbench.tsx` | `localCopilot()` — 35-line function with regex intent matching, evidence assembly, answer generation. `localCompare()` — 30-line function running `failBridgeEdges`, `scoreAllVillages`, computing deltas. `summarize()` — state aggregation. |
| `app/page.tsx` | Derived computations inline: `populationRisk`, `criticalZones`, `roadsBlocked`, `openActions`, `assistRequests`. |
| `app/tasks/page.tsx` | Derived stats (`pending`, `acknowledged`, `escalated`, `rate`) computed inline. |
| `app/after/page.tsx` | `handleDownload` function builds JSON report object inline. |
| `TaskCard.tsx` | SLA progress computation (`elapsed`, `remaining`, `progress`) is inline. |

### Recommendation
Move derived computations into the Zustand store as selectors or into dedicated `lib/scenario/selectors.ts`. Keep `localCopilot` and `localCompare` in `lib/intelligence/localFallback.ts`.

---

## 4. Weak component APIs

| Component | Issue |
|-----------|-------|
| `Card` | No semantic variant (e.g., `variant="alert"`, `variant="elevated"`). All visual differentiation is via `className` overrides. |
| `Button` | No `loading` state prop. No `leftIcon`/`rightIcon` slot — icons are passed as children mixed with text. |
| `Badge` | No `size` variant. Fixed at 10px. No `dot` variant for compact status indicators. |
| `StatCard` | Lives under `components/command/` but is used on 4 different pages — should be in `components/ui/`. |
| `PageHeader` | No `status` prop for phase badges — forced to use `actions` slot for status display. |
| `ReadinessPanel` | Uses ad-hoc `tone: "ok" | "warn" | "bad"` which doesn't match the standard `Tone` type from Badge. |
| `CardHeader` | Always renders `flex items-start justify-between` — no option for a simple header without side content. |

### Recommendation
Add `loading` and `disabled` visual states to `Button`. Add `size` variants to `Badge`. Move `StatCard` to `components/ui/`. Align `ReadinessPanel` tone with the standard `Tone` type. Add semantic Card variants.

---

## 5. Inconsistent spacing and typography

| Issue | Details |
|-------|---------|
| Font size scale | Uses arbitrary values: `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-xs`, `text-sm`, `text-lg`, `text-xl`, `text-2xl`, `text-[28px]`, `text-[30px]`. No consistent type scale. |
| Tracking values | `tracking-[0.08em]`, `tracking-[0.12em]`, `tracking-[0.14em]`, `tracking-[0.16em]`, `tracking-[0.18em]`, `tracking-[0.2em]`, `tracking-[0.22em]`, `tracking-[0.24em]` — 8 different tracking values for overline labels. |
| Section spacing | `mt-4`, `mt-5`, `mt-6`, `mt-7` all used for major section gaps on different pages — no consistent vertical rhythm. |
| Card padding | Most cards use `px-4 py-4 sm:px-5` but some use `p-3.5`, `p-4 sm:p-6`, `p-5 sm:p-6`. |
| Border opacity | `border-white/7`, `border-white/8`, `border-white/10`, `border-white/12`, `border-white/[0.075]` — 5+ variants of the same concept. |

### Recommendation
Establish a design token system with 3–4 overline tracking values, consistent section spacing (`space-section: 1.5rem`), and unified border tokens.

---

## 6. Accessibility problems

| Issue | Severity | Location |
|-------|----------|----------|
| No `<h1>` on most pages — `PageHeader` uses `<h1>` but heading hierarchy below it jumps to `<h2>` inside cards, skipping levels when cards are nested. | Medium | All pages |
| SVG map has `role="img"` + `aria-label` (good), but individual village nodes, shelter nodes, bridge status have no accessible text. | Medium | `RiskMap.tsx` |
| `<i>` tags used for colour dots in map legend — `<i>` is semantic (italic emphasis), should be `<span>`. | Low | `app/page.tsx:100-101` |
| Filter buttons in `TaskBoard` have no `aria-pressed` state. | Medium | `TaskBoard.tsx` |
| Timeline events in `TimelinePanel` and `after/page.tsx` have no `role="list"` or `<ol>` semantic. | Low | Multiple |
| Charts in `AfterActionCharts` have no text alternative or `aria-label`. | Medium | `AfterActionCharts.tsx` |
| Mobile nav links are 9px text with small touch targets — measured at ~38px height which is below the 44px minimum. | High | `AppShell.tsx:41-57` |
| `<details>/<summary>` in `DecisionPanel` has no `aria-expanded` (native provides it but the custom `+` rotation indicator isn't announced). | Low | `DecisionPanel.tsx` |
| Skip-to-content link uses `<a href>` not a `<button>` or proper skip link pattern with `:focus` styles that ensure it stays visible long enough. | Low | `AppShell.tsx:18-20` |
| Status colour dots in `StatCard` and `Sidebar` convey meaning by colour alone — no textual or icon alternative. | Medium | Multiple |
| No live region (`aria-live`) for exercise status changes, escalation notifications. | Medium | None exist |
| `select` element in `IntelligenceWorkbench` has a `htmlFor` on a `<label>` but they aren't properly associated (label is above, select is separate). | Low | `IntelligenceWorkbench.tsx:234-236` |

### Recommendation
Add `aria-pressed` to filter buttons, `role="list"` to timelines, `aria-label` to charts, increase mobile nav touch targets to 44px, add `aria-live="polite"` region for status announcements, replace `<i>` with `<span>`.

---

## 7. Mobile and tablet layout issues

| Issue | Details |
|-------|---------|
| Mobile nav text is 9px — very small and potentially illegible. | `AppShell.tsx:49` |
| StatCard grid on Command Center uses `grid-cols-2` at mobile with a `col-span-2 md:col-span-1` hack for the 5th card. | `app/page.tsx:78-86` |
| Intelligence page grid `xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]` — the 360px min could overflow on small tablets. | `IntelligenceWorkbench.tsx:181` |
| What-if comparison grid `grid-cols-[1fr_auto_1fr]` doesn't stack on mobile — before/after columns become very narrow. | `IntelligenceWorkbench.tsx:245` |
| Citizen phone preview is fixed at `max-w-[340px]` — doesn't fill available space on larger tablets. | `CitizenPhone.tsx:26` |
| After-action event chronology has `max-h-[430px]` hardcoded — could be too tall or too short depending on viewport. | `app/after/page.tsx:69` |
| Plan page `xl:grid-cols-2` means readiness panels stack vertically on tablet — reasonable but spacing could be tighter. | `app/plan/page.tsx:42` |
| No explicit `overflow-x-hidden` on body/main — long badge text or mono values could theoretically cause horizontal scroll at 360px. | Global |

### Recommendation
Increase mobile nav font to 10px and touch targets to 44px. Make what-if comparison responsive (stack on mobile). Add `overflow-x-hidden` safety to the main content area.

---

## 8. Missing loading, error and empty states

| Page/Component | Empty state | Loading state | Error state |
|----------------|-------------|---------------|-------------|
| Command Center | ✅ Idle phase shows "Start exercise" | ❌ None | ❌ None |
| Action Board | ✅ TaskBoard shows empty message | ❌ None | ❌ None |
| Intelligence | ✅ "Ask a question" placeholder | ✅ Spinner while asking | ❌ Silently falls back to local — no user feedback |
| Citizen | ✅ Phone shows "Waiting" | ❌ None | ❌ None |
| Living DDMP | ❌ No empty state — shows "92%" hardcoded even when idle | ❌ None | ❌ None |
| After-Action | ✅ "Run exercise first" CTA | ❌ None | ❌ None |
| TaskBoard filters | ✅ "No tasks match" | ❌ None | ❌ None |
| EscalationFeed | ✅ "All SLAs within limit" | ❌ None | ❌ None |

### Recommendation
Add a reusable `EmptyState` component. Add loading skeleton states for page transitions. Show a subtle toast/banner when intelligence service falls back to local mode.

---

## 9. Unnecessary client components

| Component | Issue |
|-----------|-------|
| `Badge.tsx` | Has no client-side interactivity — can be a Server Component. |
| `Card.tsx` | Pure presentational — can be a Server Component. |
| `PageHeader.tsx` | Pure presentational — can be a Server Component. |
| `ReadinessPanel.tsx` | Marked `"use client"` but has no hooks or event handlers — can be a Server Component. |
| `app/intelligence/page.tsx` | Already a Server Component (good). |

### Recommendation
Remove unnecessary `"use client"` directives from `ReadinessPanel`. `Badge`, `Card`, and `PageHeader` already omit the directive (they are Server Components that can also be used in client components) — this is correct.

---

## 10. Unnecessary rerenders / Zustand selector issues

| Component | Issue |
|-----------|-------|
| `IntelligenceWorkbench` | Subscribes to 8 separate store slices: `phase`, `villages`, `edges`, `shelters`, `tasks`, `events`, `bridgeFailed`, `startSimulation`, `failBridge`. Any change to any of these triggers a re-render. The `snapshot` memo depends on 6 of them. |
| `TaskCard` | Subscribes to `clockSeconds` — every tick (if tick is called) re-renders every visible TaskCard. |
| `EscalationFeed` | Subscribes to `clockSeconds` — same issue as TaskCard. |
| `TimelinePanel` | Subscribes to `clockSeconds` — re-renders on every tick. |
| `Sidebar` | Subscribes to `clockSeconds` — sidebar re-renders on every tick. |
| `AppShell` | Subscribes to `clockSeconds` — header re-renders on every tick. |

### Recommendation
The `tick()` action exists but is never actually called in the codebase — clock only advances via `advanceClock(minutes)`. This means the `clockSeconds` subscriptions don't cause continuous re-renders in practice. However, if tick were ever used, `TaskCard` should receive `clockSeconds` as a prop from `TaskBoard` (single parent re-render) rather than each card subscribing independently.

---

## 11. Hardcoded content that should be typed configuration

| Value | Location | Issue |
|-------|----------|-------|
| `"92%"` plan freshness | `app/plan/page.tsx:36` | Hardcoded string, not derived from any data |
| `"18/22"` resources verified | `app/plan/page.tsx:37` | Hardcoded string |
| `"2 min ago"` last sync | `app/plan/page.tsx:64` | Hardcoded string |
| LAYERS array | `app/plan/page.tsx:12-17` | Inline configuration |
| FEATURES array | `app/citizen/page.tsx:10-15` | Inline configuration |
| `PHASE_COPY` | `app/page.tsx:15-20` | Fine as local config but could be shared |
| `STATUS_TONE` | `TaskCard.tsx:11` | Duplicated concept with Badge tones |
| `KIND_TONE` | `TimelinePanel.tsx:7` | Same mapping exists implicitly elsewhere |
| `QUICK_QUESTIONS` | `IntelligenceWorkbench.tsx:16-21` | Could be in config |
| Confidence `92%` | `DecisionPanel.tsx:55` | Hardcoded in the UI — doesn't come from data |

### Recommendation
Move plan-page static values to a config or mark them clearly as prototype placeholders. Extract tone/status mappings into a shared config.

---

## 12. Missing TypeScript domain boundaries

| Issue | Details |
|-------|---------|
| `lib/intelligence/types.ts` uses `Array<Record<string, unknown>>` for settlements, roads, bridges, shelters, hospitals, resources, active_tasks, historical_events — weak typing. | These should have specific interfaces. |
| `ReadinessPanel` uses ad-hoc `{ tone: "ok" | "warn" | "bad" }` — not aligned with the `Tone` type used elsewhere. | Should use standard `Tone` or map to it. |
| `completeTask` in `tasks.ts:69-74` allows completing a `pending` task directly — skips the `acknowledged` state. | May be intentional but is undocumented. |
| No `Readonly` wrappers on configuration arrays (`INITIAL_VILLAGES`, etc.). | Data arrays are mutable by default. |

---

## 13. Inconsistent interaction feedback

| Action | Feedback |
|--------|----------|
| Start exercise | ✅ Phase changes, UI updates |
| Reset exercise | ✅ UI resets — but no confirmation dialog for a destructive action |
| Acknowledge task | ✅ Badge changes, timeline event — but no toast/animation |
| Complete task | ✅ Badge changes — but task just changes colour, no celebration or clear signal |
| Advance 15 min | ❌ Clock updates silently — no visual indicator of time change |
| SLA escalation | ✅ Badge turns red, escalation feed updates |
| Bridge failure | ✅ Map updates, replan message — good |
| Citizen evacuation | ✅ Confirmation bar appears in phone preview |
| Citizen assistance | ✅ Confirmation bar + P1 task created — good |
| Export report | ❌ File downloads silently — no success toast |

### Recommendation
Add a toast/notification system for: time advance, report export, exercise reset confirmation. Add a subtle animation on task status change.

---

## 14. Unsafe or misleading disaster-response wording

| Issue | Location | Severity |
|-------|----------|----------|
| `"Confidence 92%"` is hardcoded in the DecisionPanel and alert card — not derived from actual data or model output. Could mislead officers into trusting a fabricated number. | `app/page.tsx:65`, `DecisionPanel.tsx:55` | High |
| `"Bridge-3 · FAILED"` on the map has no timestamp or verification source shown. | `RiskMap.tsx:58` | Low |
| `"Plan freshness 92%"` on the DDMP page is entirely fabricated — no data supports it. | `app/plan/page.tsx:36` | Medium |
| `"Last sync 2 min ago"` is a static string, not a real timestamp. | `app/plan/page.tsx:64` | Medium |
| `"Weather feed · simulated"` on the alert card is good ✅ — correctly labels simulated data. | `app/page.tsx:63` | N/A |
| The safety disclaimer in `data.ts` exists but is not rendered on any page. | `DEMO_DISCLAIMER` in `data.ts:128-129` | Medium |

### Recommendation
Replace hardcoded "92%" confidence with a value derived from actual risk computation (the `RISK_WEIGHTS` already produce a real score). Display the `DEMO_DISCLAIMER` in the app footer or sidebar. Add "(simulated)" labels to fabricated plan freshness values.

---

## Summary statistics

| Category | Count |
|----------|-------|
| Oversized components | 2 critical, 3 moderate |
| Duplicated pattern clusters | 6 |
| Business logic in UI | 5 files |
| Weak component APIs | 7 components |
| Accessibility issues | 12 |
| Mobile/tablet issues | 8 |
| Missing states | 10 missing loading states, 8 missing error states |
| Hardcoded values | 10 |
| Unsafe wording | 4 issues |
