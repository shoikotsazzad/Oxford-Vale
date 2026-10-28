"use client";
import { useState, useTransition } from "react";
import type { Result } from "@/server/result";

/** Runs an admin server action and keeps its error / field errors / success message for the form. */
export function useAdminAction() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  function run<T>(action: () => Promise<Result<T>>, opts: { success?: string; onOk?: (data: T) => void } = {}) {
    setError(null);
    setMessage(null);
    start(async () => {
      try {
        const res = await action();
        if (res.ok) {
          setFields({});
          if (opts.success) setMessage(opts.success);
          opts.onOk?.(res.data);
        } else {
          setError(res.error.message);
          setFields(res.error.fields ?? {});
        }
      } catch {
        setError("Couldn't reach the server. Check your connection and try again.");
      }
    });
  }
  const clear = (name: string) => fields[name] && setFields(({ [name]: _, ...rest }) => rest);
  return { run, pending, error, fields, message, clear, setMessage };
}

export function FormStatus({ error, message }: { error: string | null; message: string | null }) {
  if (error) return <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>;
  if (message) return <p role="status" className="rounded-md bg-success/10 px-4 py-3 text-sm text-success">{message}</p>;
  return null;
}
