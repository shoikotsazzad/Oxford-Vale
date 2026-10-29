import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/server/admin/guard";
import { can } from "@/server/auth/rbac";
import { CategoryModel, ProductModel } from "@/models";
import { CategoryForm, type CategoryValue } from "@/components/admin/CatalogForms";
import { Badge, Card, EmptyRow, PageHeader, ReadOnlyNote, Table, TableSkeleton, td, th } from "@/components/admin/ui";

export const metadata = { title: "Categories" };

export default function CategoriesPage(props: PageProps<"/admin/categories">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Categories {...props} />
    </Suspense>
  );
}

async function Categories({ searchParams }: PageProps<"/admin/categories">) {
  const admin = await requireAdminPage("catalog.view");
  const editable = can(admin.role, "catalog.edit");
  const { edit } = await searchParams;
  const [categories, counts] = await Promise.all([
    CategoryModel.find().sort({ sortOrder: 1, name: 1 }).lean(),
    ProductModel.aggregate<{ _id: unknown; n: number }>([{ $match: { status: { $ne: "archived" } } }, { $group: { _id: "$category", n: { $sum: 1 } } }]),
  ]);
  const count = new Map(counts.map((c) => [String(c._id), c.n]));

  let form: CategoryValue | null = null;
  if (editable && edit === "new") form = { name: "", slug: "", description: "", image: "", sortOrder: (categories.at(-1)?.sortOrder ?? 0) + 1, isActive: true, showInNav: false, seoTitle: "", seoDescription: "" };
  else if (editable && typeof edit === "string") {
    const c = categories.find((x) => String(x._id) === edit);
    if (!c) notFound();
    form = { id: String(c._id), name: c.name, slug: c.slug, description: c.description ?? "", image: c.image ?? "", sortOrder: c.sortOrder ?? 0, isActive: c.isActive, showInNav: c.showInNav, seoTitle: c.seoTitle ?? "", seoDescription: c.seoDescription ?? "" };
  }

  return (
    <>
      <PageHeader title="Categories" text="Categories you can't delete: hide them instead (products keep their category)." actions={editable && !form && <Link href="/admin/categories?edit=new" className="label inline-flex h-10 items-center rounded-md bg-ink px-4 text-paper hover:bg-charcoal">Add category</Link>} />
      {!editable && <ReadOnlyNote />}
      {form && (
        <Card title={form.id ? `Edit ${form.name}` : "New category"} className="mb-6">
          <CategoryForm key={form.id ?? "new"} initial={form} />
        </Card>
      )}
      <Table minWidth="40rem">
        <thead>
          <tr><th className={th}>Name</th><th className={th}>Link</th><th className={`${th} text-right`}>Products</th><th className={th}>Visibility</th><th className={th} /></tr>
        </thead>
        <tbody>
          {categories.length ? categories.map((c) => (
            <tr key={String(c._id)}>
              <td className={td}><span className="font-medium">{c.name}</span><p className="text-xs text-muted">Order {c.sortOrder}</p></td>
              <td className={td}><a href={`/shop/${c.slug}`} target="_blank" rel="noreferrer" className="text-muted hover:underline">/shop/{c.slug}</a></td>
              <td className={`${td} text-right tabular-nums`}><Link href={`/admin/products?category=${c._id}`} className="underline">{count.get(String(c._id)) ?? 0}</Link></td>
              <td className={td}><div className="flex flex-wrap gap-1">{c.isActive ? <Badge tone="ok">Visible</Badge> : <Badge>Hidden</Badge>}{c.showInNav && <Badge tone="info">In menu</Badge>}</div></td>
              <td className={`${td} text-right`}>{editable && <Link href={`/admin/categories?edit=${c._id}`} className="underline">Edit</Link>}</td>
            </tr>
          )) : <EmptyRow cols={5} text="No categories yet." />}
        </tbody>
      </Table>
    </>
  );
}
