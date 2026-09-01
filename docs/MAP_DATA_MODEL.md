# Map Data Model

## Strategy
We employ an interactive, data-driven SVG mapping architecture that translates geographic scenario domain logic (X/Y coordinates) into visual clusters without needing external heavy WebGL or MapLibre bundles, ensuring flawless, offline-capable performance.

## Layers
The layers represent active domain types:
- **Villages**: Rendered with pulsing rings during critical events.
- **Routes**: Dashed/solid lines adapting dynamically to 'blocked' states.
- **Shelters**: Responsive UI capacity bars updating based on \`shelter.occupied / shelter.capacity\`.
- **Assets (Bridge/Hospital)**: Distinctive vector shapes equipped with onClick events that connect with the \`AssetInspector\`.

## Asset Inspector 
Presents highly specific data payloads when map features are clicked.
