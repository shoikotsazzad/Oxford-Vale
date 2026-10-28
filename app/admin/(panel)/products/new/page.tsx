import { Suspense } from "react";
import Link from "next/link";
import { requireAdminPage } from "@/server/admin/guard";
import { productEditorData } from "@/server/services/product-admin";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader, TableSkeleton } from "@/components/admin/ui";

export const metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <NewProduct />
    </Suspense>
  );
}

async function NewProduct() {
  await requireAdminPage("catalog.edit");
  const data = (await productEditorData())!;
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/products" className="text-muted hover:text-ink">← Products</Link></p>
      <PageHeader title="New product" text="Saved as a draft until you set the status to Active." />
      <ProductForm initial={data.initial} categories={data.categories} collections={data.collections} readOnly={false} />
    </>
  );
}
