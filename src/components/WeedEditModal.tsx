"use client";

import { useState } from "react";
import type { AnalyzedSession, SessionEntry } from "@/lib/types";
import { toLocalInput, fromLocalInput } from "@/lib/drinks";
import { updateSession, deleteSession } from "@/lib/sessionStore";
import WeedForm from "@/components/WeedForm";

/** Edit sheet for an existing session. Renders nothing when `session` is null. */
export default function WeedEditModal({
  session,
  onClose,
}: {
  session: SessionEntry | null;
  onClose: () => void;
}) {
  if (!session) return null;
  return <EditSheet key={session.id} session={session} onClose={onClose} />;
}

function EditSheet({ session, onClose }: { session: SessionEntry; onClose: () => void }) {
  const [draft, setDraft] = useState<AnalyzedSession>({
    name: session.name,
    method: session.method,
    amount: session.amount,
    thc_percent: session.thc_percent,
    notes: session.notes,
  });
  const [when, setWhen] = useState(toLocalInput(session.created_at));

  function save() {
    if (!draft.name.trim()) return;
    updateSession(session.id, draft, fromLocalInput(when));
    onClose();
  }

  function remove() {
    deleteSession(session.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <button aria-label="Close" className="absolute inset-0" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-stone-50 p-5 shadow-xl dark:bg-stone-950 sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Edit session</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <WeedForm
          value={draft}
          onChange={setDraft}
          onSave={save}
          onCancel={onClose}
          when={when}
          onWhenChange={setWhen}
          saveLabel="Save changes"
          onDelete={remove}
        />
      </div>
    </div>
  );
}
