import { TimelineEvent } from "./types";

let counter = 0;
function nextId() {
  counter += 1;
  return `evt-${counter}`;
}

export function makeEvent(
  atSec: number,
  label: string,
  detail: string,
  kind: TimelineEvent["kind"] = "info"
): TimelineEvent {
  return { id: nextId(), atSec, label, detail, kind };
}

export function formatClock(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}
