# Phase 2 QA

- **Accessibility**: Map controls use appropriate ARIA labels. The \`AssetInspector\` handles close events smoothly. 
- **Responsive Framework**: The Command Center gracefully shrinks on mobile, converting the timeline and decision panel into stacked 1-column layouts, preserving the map touch-target scale at the top.
- **Performance**: The asset filters \`visibleTasks\` and \`visibleEdges\` utilize \`useMemo\` and standard hooks to avoid wasteful recalculations when tracking the \`RiskMap\`.
