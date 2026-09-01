"use client";

import { useState, useRef, MouseEvent, WheelEvent, PointerEvent as ReactPointerEvent } from "react";
import { ZoomIn, ZoomOut, Maximize, Layers } from "lucide-react";
import { BRIDGE, HOSPITAL, RESCUE_TEAMS } from "@/lib/scenario/data";
import { useScenarioStore } from "@/lib/scenario/store";
import { Severity } from "@/lib/scenario/types";
import { Button } from "@/components/ui/Button";
import { AssetInspector } from "./AssetInspector";

const STATUS_COLOR: Record<Severity, string> = {
  safe: "#34d399",
  watch: "#fb923c",
  critical: "#f87171",
};

export function RiskMap() {
  const villages = useScenarioStore((state) => state.villages);
  const edges = useScenarioStore((state) => state.edges);
  const shelters = useScenarioStore((state) => state.shelters);
  const bridgeFailed = useScenarioStore((state) => state.bridgeFailed);

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const handlePointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    // Only left click
    if (e.button !== 0) return;
    setIsDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setTransform((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const scaleAdjust = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(Math.max(0.5, prev.scale * scaleAdjust), 3),
    }));
  };

  const handleZoom = (inOut: number) => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(Math.max(0.5, prev.scale * (inOut > 0 ? 1.2 : 0.8)), 3),
    }));
  };

  const handleReset = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
    setSelectedAsset(null);
  };

  const selectAsset = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setSelectedAsset(id);
  };

  return (
    <div className="relative flex h-[500px] w-full flex-col overflow-hidden rounded-xl border border-white/7 bg-[#07111f]">
      {/* Map Controls */}
      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
        <Button variant="secondary" size="sm" onClick={() => handleZoom(1)} className="h-8 w-8 rounded-full p-0 shadow-lg" aria-label="Zoom in">
          <ZoomIn size={14} />
        </Button>
        <Button variant="secondary" size="sm" onClick={() => handleZoom(-1)} className="h-8 w-8 rounded-full p-0 shadow-lg" aria-label="Zoom out">
          <ZoomOut size={14} />
        </Button>
        <Button variant="secondary" size="sm" onClick={handleReset} className="h-8 w-8 rounded-full p-0 shadow-lg" aria-label="Reset view">
          <Maximize size={14} />
        </Button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-[#07111f] to-transparent px-4 py-3 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <span>Tehri river corridor · Interactive</span>
        <span className="flex items-center gap-1"><Layers size={12} /> Layer 04 / response</span>
      </div>

      <AssetInspector selectedAsset={selectedAsset} onClose={() => setSelectedAsset(null)} />

      <svg
        ref={svgRef}
        viewBox="0 0 900 500"
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onClick={() => setSelectedAsset(null)}
        role="group"
        aria-label="Interactive Operational risk map"
      >
        <defs>
          <linearGradient id="river" x1="0" x2="1">
            <stop offset="0" stopColor="#0284c7" stopOpacity="0.24" />
            <stop offset="0.55" stopColor="#38bdf8" stopOpacity="0.5" />
            <stop offset="1" stopColor="#0ea5e9" stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          <path
            d="M80,140 C190,195 190,320 315,334 C425,345 465,272 565,294 C690,320 742,430 850,444"
            stroke="url(#river)"
            strokeWidth="18"
            fill="none"
            aria-hidden="true"
          />
          <path
            d="M80,140 C190,195 190,320 315,334 C425,345 465,272 565,294 C690,320 742,430 850,444"
            stroke="#38bdf8"
            strokeOpacity="0.32"
            strokeWidth="2"
            strokeDasharray="5 8"
            fill="none"
            style={{ animation: "dash 5s linear infinite" }}
            aria-hidden="true"
          />

          {edges.map((edge) => (
            <g key={edge.id} role="img" aria-label={`Route ${edge.label}, status: ${edge.status}`}>
              <path d={edge.path} fill="none" stroke="#020617" strokeWidth={edge.status === "blocked" ? 7 : 6} opacity="0.72" />
              <path
                d={edge.path}
                fill="none"
                stroke={edge.status === "blocked" ? "#f87171" : edge.isBridgeDependent ? "#94a3b8" : "#64748b"}
                strokeWidth={edge.status === "blocked" ? 3 : 2.25}
                strokeDasharray={edge.status === "blocked" ? "7 7" : undefined}
                opacity={edge.status === "blocked" ? 0.95 : 0.82}
              />
            </g>
          ))}

          {/* Bridge Asset */}
          <g 
            transform={`translate(${BRIDGE.x} ${BRIDGE.y})`} 
            onClick={(e) => selectAsset("bridge-3", e)}
            className="cursor-pointer"
            role="button" 
            aria-label={`Bridge-3, status: ${bridgeFailed ? "Failed" : "Open"}`}
          >
            {bridgeFailed && <circle r="27" fill="#ef4444" opacity="0.14" filter="url(#glow)" />}
            <rect
              x={-21} y={-8} width={42} height={16} rx={4}
              fill={bridgeFailed ? "#ef4444" : "#64748b"}
              stroke={selectedAsset === "bridge-3" ? "#ffffff" : bridgeFailed ? "#fca5a5" : "#cbd5e1"}
              strokeWidth={selectedAsset === "bridge-3" ? "2" : "1"}
            />
            <text textAnchor="middle" y={-16} fontSize="10" fontWeight="700" fill={bridgeFailed ? "#fca5a5" : "#cbd5e1"}>
              Bridge-3 {bridgeFailed ? "· FAILED" : "· OPEN"}
            </text>
          </g>

          {/* District Hospital Asset */}
          <g 
            transform={`translate(${HOSPITAL.x} ${HOSPITAL.y})`} 
            onClick={(e) => selectAsset("hospital", e)}
            className="cursor-pointer"
            role="button" 
            aria-label="District Hospital"
          >
            <rect 
              x={-48} y={-27} width={96} height={54} rx={10} 
              fill="#0f1b2d" 
              stroke={selectedAsset === "hospital" ? "#ffffff" : "#334155"} 
              strokeWidth={selectedAsset === "hospital" ? "2" : "1"}
            />
            <circle cx={-30} cy={0} r={11} fill="#ef4444" fillOpacity="0.12" />
            <path d="M-35 0h10M-30-5v10" stroke="#f87171" strokeWidth="2" />
            <text x={-13} y={-2} fontSize="9" fontWeight="700" fill="#cbd5e1">DISTRICT</text>
            <text x={-13} y={10} fontSize="8" fill="#64748b">HOSPITAL</text>
          </g>

          {/* Shelters */}
          {shelters.map((shelter) => {
            const load = Math.min(100, Math.round((shelter.occupied / shelter.capacity) * 100));
            return (
              <g
                key={shelter.id}
                transform={`translate(${shelter.x} ${shelter.y})`}
                onClick={(e) => selectAsset(shelter.id, e)}
                className="cursor-pointer"
                role="button"
                aria-label={`Shelter ${shelter.name}, capacity: ${shelter.occupied} of ${shelter.capacity} assigned`}
              >
                <rect 
                  x={-48} y={-31} width={96} height={62} rx={11} 
                  fill="#08221f" 
                  stroke={selectedAsset === shelter.id ? "#ffffff" : "#0f766e"} 
                  strokeWidth={selectedAsset === shelter.id ? "2" : "1"}
                />
                <text x={-38} y={-11} fontSize="10" fontWeight="700" fill="#5eead4">{shelter.name.split(" — ")[0]}</text>
                <text x={-38} y={5} fontSize="8.5" fill="#94a3b8">
                  {shelter.occupied.toLocaleString()}/{shelter.capacity.toLocaleString()} assigned
                </text>
                <rect x={-38} y={14} width={76} height={4} rx={2} fill="#134e4a" />
                <rect x={-38} y={14} width={(76 * load) / 100} height={4} rx={2} fill={load > 90 ? "#fb923c" : "#2dd4bf"} />
              </g>
            );
          })}

          {/* Rescue Teams */}
          {RESCUE_TEAMS.map((team) => (
            <g 
              key={team.id} 
              transform={`translate(${team.x} ${team.y})`} 
              onClick={(e) => selectAsset(team.id, e)}
              className="cursor-pointer"
              role="button" 
              aria-label={`Rescue team ${team.id.toUpperCase()}`}
            >
              <circle r={13} fill="#082f49" stroke={selectedAsset === team.id ? "#ffffff" : "#0ea5e9"} strokeWidth={selectedAsset === team.id ? "2" : "1"} />
              <circle r={4} fill="#38bdf8" />
              <text x={18} y={4} fontSize="9" fontWeight="700" fill="#7dd3fc">{team.id.toUpperCase()}</text>
            </g>
          ))}

          {/* Villages */}
          {villages.map((village) => (
            <g
              key={village.id}
              transform={`translate(${village.x} ${village.y})`}
              onClick={(e) => selectAsset(village.id, e)}
              className="cursor-pointer"
              role="button"
              aria-label={`Settlement ${village.name}, population ${village.population}, status: ${village.status}`}
            >
              {village.status === "critical" && (
                <circle
                  r={25} fill="none" stroke={STATUS_COLOR[village.status]} strokeWidth={2}
                  style={{ animation: "pulse-ring 1.6s ease-out infinite" }}
                />
              )}
              <circle r={26} fill="#07111f" stroke={selectedAsset === village.id ? "#ffffff" : STATUS_COLOR[village.status]} strokeWidth={selectedAsset === village.id ? "3" : "2"} />
              <circle r={18} fill={STATUS_COLOR[village.status]} fillOpacity="0.13" />
              <text textAnchor="middle" y={4} fontSize="12" fontWeight="800" fill={STATUS_COLOR[village.status]}>
                {village.name.split(" ")[1]?.[0] ?? village.name[0]}
              </text>
              <text textAnchor="middle" y={-37} fontSize="10" fontWeight="700" fill="#e2e8f0">{village.name}</text>
              <text textAnchor="middle" y={45} fontSize="8.5" fill="#64748b">
                RISK {Math.round(village.riskScore * 100)}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
