# Final Frontend Architecture
The frontend follows a modular Next.js App Router structure.
- State is managed via Zustand with sessionStorage persistence.
- Views are scoped to `/`, `/tasks`, `/intelligence`, `/citizen`, `/plan`, `/after`.
- Fallbacks for error, loading, and not-found states are fully implemented.
