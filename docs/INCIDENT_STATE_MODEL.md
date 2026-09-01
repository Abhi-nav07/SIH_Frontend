# Incident State Model

## State Transitions
The workflow dictates strict deterministic state phases matching the lifecycle:
\`idle\` -> \`recommendation_ready\` -> \`response_active\` -> \`disrupted\` -> \`replanning\` -> \`replanned\` -> \`exercise_complete\`.

## Workflow
State transitions are bound directly to actions. \`confirmRecommendation()\` forces the shift from \`recommendation_ready\` to \`response_active\`. 
\`failBridge()\` interrupts the engine, pushing into \`disrupted\` and queuing rapid \`replanned\` generation.
