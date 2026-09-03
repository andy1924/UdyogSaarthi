/**
 * C19b toasts — bottom-center above the CTA bar, `role="status"`, 4 s
 * auto-dismiss.
 *
 * Transport: a minimal event-emitter (module-local listener set), NOT React
 * context — any module (e.g. DprDialog) can `pushToast(msg)` without being
 * under a provider. `Toasts` subscribes on mount and unsubscribes on unmount.
 */

"use client";

import { useEffect, useState } from "react";

export interface ToastItem {
  id: number;
  msg: string;
}

type Listener = (item: ToastItem) => void;

const listeners = new Set<Listener>();
let seq = 0;

const DISMISS_MS = 4_000;

/** Append a toast; rendered by `<Toasts/>`, auto-dismissed after 4 s. */
export function pushToast(msg: string): void {
  seq += 1;
  const item: ToastItem = { id: seq, msg };
  listeners.forEach((fn) => fn(item));
}

export default function Toasts() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (item: ToastItem) => {
      setItems((prev) => [...prev.slice(-2), item]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== item.id));
      }, DISMISS_MS);
    };
    listeners.add(onToast);
    return () => {
      listeners.delete(onToast);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      {items.map((item) => (
        <p key={item.id} className="toast">
          {item.msg}
        </p>
      ))}
    </div>
  );
}
