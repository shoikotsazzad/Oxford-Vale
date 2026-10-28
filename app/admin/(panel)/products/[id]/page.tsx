import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/server/admin/guard";
import { can } from "@/server/auth/rbac";
import { productEditorData } from "@/server/services/product-admin";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductActions } from "@/components/admin/ProductActions";
import { PageHeader, ReadOnlyNote, TableSkeleton } from "@/components/admin/ui";

export const metadata = { title: "Edit product" };

export default function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <EditProduct {...props} />
    </Suspense>
  );
}

async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  const admin = await requireAdminPage("catalog.view");
  const { id } = await params;
  const data = /^[a-f0-9]{24}$/.test(id) ? await productEditorData(id) : null;
  if (!data?.product) notFound();
  const editable = can(admin.role, "catalog.edit");
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/products" className="text-muted hover:text-ink">← Products</Link></p>
      <PageHeader
        title={data.product.name}
        text={data.product.status === "active" ? undefined : `This product is ${data.product.status} and hidden from the store.`}
        actions={
          <>
            {data.product.status === "active" && <a href={`/product/${data.product.slug}`} target="_blank" rel="noreferrer" className="label inline-flex h-11 items-center rounded-md px-3 text-muted hover:text-ink">View in store</a>}
            {editable && <ProductActions id={data.product.id} status={data.product.status} />}
          </>
        }
      />
      {!editable && <ReadOnlyNote />}
      <ProductForm key={data.product.id} id={data.product.id} initial={data.initial} categories={data.categories} collections={data.collections} readOnly={!editable} />
    </>
  );
}
