"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { duplicateProductAction, setProductStatusAction } from "@/server/actions/admin/catalog";
import { FormStatus, useAdminAction } from "./useAdminAction";

export function ProductActions({ id, status }: { id: string; status: "draft" | "active" | "archived" }) {
  const router = useRouter();
  const { run, pending, error } = useAdminAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" disabled={pending} onClick={() => run(() => duplicateProductAction({ id }), { onOk: (d) => router.push(`/admin/products/${d.id}`) })}>Duplicate</Button>
      {status === "archived" ? (
        <Button variant="secondary" disabled={pending} onClick={() => run(() => setProductStatusAction({ id, status: "draft" }))}>Restore as draft</Button>
      ) : (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => window.confirm("Archive this product? It disappears from the store but stays in past orders.") && run(() => setProductStatusAction({ id, status: "archived" }))}
        >
          Archive
        </Button>
      )}
      <div className="w-full empty:hidden"><FormStatus error={error} message={null} /></div>
    </div>
  );
}
