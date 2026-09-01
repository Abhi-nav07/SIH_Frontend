"use client";

import { useScenarioStore } from "@/lib/scenario/store";
import { Button } from "@/components/ui/Button";
import { ShieldAlert, Check, X, AlertTriangle } from "lucide-react";
import { useState } from "react";

export function HumanConfirmation() {
  const actions = useScenarioStore((state) => state.actions);
  const phase = useScenarioStore((state) => state.phase);
  const confirmRecommendation = useScenarioStore((state) => state.confirmRecommendation);
  const rejectRecommendation = useScenarioStore((state) => state.rejectRecommendation);

  // We only show this during recommendation_ready or response_active if there is an unconfirmed proposed action
  const proposedAction = actions.find(a => a.status === "proposed" && a.supersededBy === null);

  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (!proposedAction || (phase !== "recommendation_ready" && phase !== "response_active" && phase !== "replanned")) {
    return null;
  }

  const handleConfirm = () => {
    confirmRecommendation(proposedAction.id, "Exercise Controller");
  };

  const handleReject = () => {
    if (!rejectReason) return;
    rejectRecommendation(proposedAction.id, "Exercise Controller", rejectReason);
    setIsRejecting(false);
    setRejectReason("");
  };

  return (
    <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4 shadow-sm" role="alert" aria-live="polite">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-200 text-orange-700">
          <ShieldAlert size={20} aria-hidden="true" />
        </span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Priority Recommendation</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">Action Required</span>
          </div>
          <p className="mt-1 text-lg font-black text-slate-800">{proposedAction.title}</p>
          <div className="mt-2 rounded-lg bg-white/60 p-3 text-xs leading-5 text-slate-700">
            <div className="font-semibold text-slate-900">Evidence:</div>
            {proposedAction.reason}
          </div>
          
          <div className="mt-4 flex gap-3 text-[11px] font-semibold text-slate-600">
            <span className="flex items-center gap-1"><AlertTriangle size={14} className="text-orange-500" /> Risk Score: {Math.round(proposedAction.riskScore)}</span>
            <span>Decision Window: {proposedAction.windowMinutes} min</span>
          </div>

          {!isRejecting ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:justify-end">
              <Button variant="ghost" onClick={() => setIsRejecting(true)} className="text-slate-600 hover:text-red-700">
                <X size={16} /> Reject
              </Button>
              <Button variant="success" onClick={handleConfirm} className="bg-emerald-600 hover:bg-emerald-700">
                <Check size={16} /> Confirm & Execute
              </Button>
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-white p-3 shadow-sm">
              <label htmlFor="reject-reason" className="block text-xs font-semibold text-slate-700">Reason for rejection:</label>
              <input 
                id="reject-reason"
                type="text" 
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none" 
                placeholder="E.g., Resources unavailable, inaccurate data..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                autoFocus
              />
              <div className="mt-3 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setIsRejecting(false)}>Cancel</Button>
                <Button size="sm" variant="danger" disabled={!rejectReason} onClick={handleReject}>Submit Rejection</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
