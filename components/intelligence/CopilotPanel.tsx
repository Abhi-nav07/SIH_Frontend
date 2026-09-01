import { FormEvent } from "react";
import { BrainCircuit, LoaderCircle, Send, ShieldCheck, Sparkles } from "lucide-react";
import { CopilotResponse } from "@/lib/intelligence/types";
import { QUICK_QUESTIONS } from "@/lib/intelligence/config";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface CopilotPanelProps {
  question: string;
  answer: CopilotResponse | null;
  asking: boolean;
  onQuestionChange: (value: string) => void;
  onAsk: (prompt: string) => void;
}

export function CopilotPanel({ question, answer, asking, onQuestionChange, onAsk }: CopilotPanelProps) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onAsk(question);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="items-center border-b border-white/7 bg-gradient-to-r from-cyan-500/[0.07] to-transparent pb-4">
        <SectionHeader
          title="Incident Commander Copilot"
          description="Structured data in · evidence-backed answer out"
          icon={<BrainCircuit size={20} aria-hidden="true" />}
        />
        <Badge tone={answer?.source === "service" ? "success" : "info"}>
          {answer?.source === "service" ? "Service connected" : "Deterministic mode"}
        </Badge>
      </CardHeader>
      <CardBody className="pt-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Quick questions">
          {QUICK_QUESTIONS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onAsk(prompt)}
              className="rounded-full border border-white/8 bg-white/[0.025] px-3 py-2 text-[10px] font-semibold text-slate-400 transition-colors hover:border-cyan-400/25 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="mt-4 min-h-[250px] rounded-2xl border border-white/7 bg-black/15 p-4 sm:p-5" aria-live="polite">
          {asking ? (
            <div className="flex min-h-[210px] flex-col items-center justify-center text-center">
              <LoaderCircle size={24} className="animate-spin text-cyan-400" aria-hidden="true" />
              <div className="mt-3 text-xs font-bold text-slate-300">Running deterministic tools</div>
              <div className="mt-1 text-[10px] text-slate-600">Checking risk, route, capacity and task evidence</div>
            </div>
          ) : answer ? (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">{answer.intent}</Badge>
                <span className="text-[10px] text-slate-600">Confidence {Math.round(answer.confidence * 100)}%</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-200">{answer.answer}</p>
              {answer.evidence.length > 0 && (
                <div className="mt-5">
                  <div className="text-section-label">Evidence used</div>
                  <div className="mt-2 flex flex-wrap gap-2" role="list">
                    {answer.evidence.map((item, index) => (
                      <span
                        key={`${item.key}-${index}`}
                        role="listitem"
                        className="rounded-lg border border-white/7 bg-white/[0.03] px-2.5 py-2 text-[10px] text-slate-400"
                      >
                        <b className="text-slate-200">{item.key.replaceAll("_", " ")}:</b>{" "}
                        {String(item.value)}
                        {item.unit ? ` ${item.unit}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-5 flex items-center gap-2 border-t border-white/7 pt-3 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                <ShieldCheck size={12} aria-hidden="true" /> {answer.status}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[210px] flex-col items-center justify-center text-center">
              <Sparkles size={24} className="text-slate-600" aria-hidden="true" />
              <div className="mt-3 text-xs font-bold text-slate-300">Ask an operational question</div>
              <p className="mt-1 max-w-sm text-[11px] leading-5 text-slate-600">
                The copilot only verbalises facts returned by deterministic tools. Unsupported questions fail safely.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={submit} className="mt-4 flex gap-2">
          <label className="flex min-h-11 flex-1 items-center rounded-xl border border-white/8 bg-white/[0.03] px-3 focus-within:border-cyan-400/35">
            <span className="sr-only">Ask the Incident Commander Copilot</span>
            <input
              value={question}
              onChange={(event) => onQuestionChange(event.target.value)}
              placeholder="Ask about priority, routes, shelters or resources…"
              className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
            />
          </label>
          <Button type="submit" disabled={!question.trim() || asking} aria-label="Send question">
            <Send size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Ask</span>
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
