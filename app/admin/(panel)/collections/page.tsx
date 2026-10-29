import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/server/admin/guard";
import { can } from "@/server/auth/rbac";
import { CollectionModel, ProductModel } from "@/models";
import { CollectionForm, type CollectionValue } from "@/components/admin/CatalogForms";
import { Badge, Card, EmptyRow, PageHeader, ReadOnlyNote, Table, TableSkeleton, td, th } from "@/components/admin/ui";

export const metadata = { title: "Collections" };

export default function CollectionsPage(props: PageProps<"/admin/collections">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Collections {...props} />
    </Suspense>
  );
}

async function Collections({ searchParams }: PageProps<"/admin/collections">) {
  const admin = await requireAdminPage("catalog.view");
  const editable = can(admin.role, "catalog.edit");
  const { edit } = await searchParams;
  const collections = await CollectionModel.find().sort({ sortOrder: 1, name: 1 }).lean();

  let form: CollectionValue | null = null;
  if (editable && edit === "new") form = { name: "", slug: "", description: "", image: "", sortOrder: (collections.at(-1)?.sortOrder ?? 0) + 1, isActive: true, products: [] };
  else if (editable && typeof edit === "string") {
    const c = collections.find((x) => String(x._id) === edit);
    if (!c) notFound();
    form = { id: String(c._id), name: c.name, slug: c.slug, description: c.description ?? "", image: c.image ?? "", sortOrder: c.sortOrder ?? 0, isActive: c.isActive, products: (c.products ?? []).map(String) };
  }
  const products = form ? (await ProductModel.find({ status: { $ne: "archived" } }).sort({ name: 1 }).select("name skuBase").lean()).map((p) => ({ id: String(p._id), name: p.name, sku: p.skuBase })) : [];

  return (
    <>
      <PageHeader title="Collections" text="Curated groups like Best Sellers. The home page “Best of” row shows the Best Sellers collection in this order." actions={editable && !form && <Link href="/admin/collections?edit=new" className="label inline-flex h-10 items-center rounded-md bg-ink px-4 text-paper hover:bg-charcoal">Add collection</Link>} />
      {!editable && <ReadOnlyNote />}
      {form && (
        <Card title={form.id ? `Edit ${form.name}` : "New collection"} className="mb-6">
          <CollectionForm key={form.id ?? "new"} initial={form} products={products} />
        </Card>
      )}
      <Table minWidth="40rem">
        <thead>
          <tr><th className={th}>Name</th><th className={th}>Link</th><th className={`${th} text-right`}>Products</th><th className={th}>Visibility</th><th className={th} /></tr>
        </thead>
        <tbody>
          {collections.length ? collections.map((c) => (
            <tr key={String(c._id)}>
              <td className={td}><span className="font-medium">{c.name}</span><p className="text-xs text-muted">Order {c.sortOrder}</p></td>
              <td className={td}><a href={`/collections/${c.slug}`} target="_blank" rel="noreferrer" className="text-muted hover:underline">/collections/{c.slug}</a></td>
              <td className={`${td} text-right tabular-nums`}>{c.products?.length ?? 0}</td>
              <td className={td}>{c.isActive ? <Badge tone="ok">Visible</Badge> : <Badge>Hidden</Badge>}</td>
              <td className={`${td} text-right`}>{editable && <Link href={`/admin/collections?edit=${c._id}`} className="underline">Edit</Link>}</td>
            </tr>
          )) : <EmptyRow cols={5} text="No collections yet." />}
        </tbody>
      </Table>
    </>
  );
}
