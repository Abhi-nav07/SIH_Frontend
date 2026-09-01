# Command Center Architecture

## Overview
The Command Center (\`/\`) functions as the primary operational workspace. It separates complex layout components (Map, Decision, Timeline, Metrics) into independent client components, while sharing context exclusively through the deterministic Zustand event engine.

## Information Hierarchy
- **Header**: Incident phase, overall simulated timestamp, hazard severity.
- **Situation Metrics**: Current metrics alongside historical tracking deltas triggered by bridge failures or replans.
- **Top Recommendation**: Prominent decision component offering priority action with risk score, deadlines, and reasons.
- **Operational Map**: Rich visualization of settlements, edges, bridge choke-points.
- **Timeline**: Chronological structured sequence of events.
