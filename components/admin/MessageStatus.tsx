"use client";
import { setMessageStatus } from "@/server/actions/admin/store";
import { useAdminAction } from "./useAdminAction";

export function MessageStatus({ id, status }: { id: string; status: string }) {
  const { run, pending, error } = useAdminAction();
  return (
    <div>
      <select
        aria-label="Message status"
        defaultValue={status}
        disabled={pending}
        onChange={(e) => run(() => setMessageStatus({ id, status: e.target.value }))}
        className="h-10 rounded-md border border-line bg-surface px-2 text-sm outline-none focus:border-ink"
      >
        <option value="new">New</option>
        <option value="read">Read</option>
        <option value="replied">Replied</option>
        <option value="closed">Closed</option>
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
