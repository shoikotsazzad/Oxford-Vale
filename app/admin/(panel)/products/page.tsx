import { Suspense } from "react";
import Link from "next/link";
import { requireAdminPage } from "@/server/admin/guard";
import { can } from "@/server/auth/rbac";
import { getSettings } from "@/server/services/settings";
import { CategoryModel, ProductModel, VariantModel } from "@/models";
import { formatMoney } from "@/lib/money";
import { Thumb } from "@/components/admin/Thumb";
import {
  AdminPagination, Badge, EmptyRow, escapeRegex, Filter, FilterBar, filterInput, listHref, PageHeader, pageOf, Table, TableSkeleton, td, th,
} from "@/components/admin/ui";

export const metadata = { title: "Products" };
const PER_PAGE = 25;

export default function ProductsPage(props: PageProps<"/admin/products">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Products {...props} />
    </Suspense>
  );
}

async function Products({ searchParams }: PageProps<"/admin/products">) {
  const admin = await requireAdminPage("catalog.view");
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const params = { q: one("q"), category: one("category"), status: one("status"), stock: one("stock") };
  const { lowStockThreshold } = await getSettings();

  const filter: Record<string, unknown> = {};
  if (params.q?.trim()) {
    const rx = new RegExp(escapeRegex(params.q.trim().slice(0, 60)), "i");
    const skuHits = await VariantModel.distinct("product", { sku: rx });
    filter.$or = [{ name: rx }, { skuBase: rx }, { _id: { $in: skuHits } }];
  }
  if (/^[a-f0-9]{24}$/.test(params.category ?? "")) filter.category = params.category;
  if (["draft", "active", "archived"].includes(params.status ?? "")) filter.status = params.status;
  else filter.status = { $ne: "archived" };
  if (params.stock === "out") filter.inStock = false;
  if (params.stock === "low") filter._id = { $in: await VariantModel.distinct("product", { isActive: true, stock: { $lte: lowStockThreshold } }) };

  const [categories, total] = await Promise.all([CategoryModel.find().sort({ sortOrder: 1 }).select("name").lean(), ProductModel.countDocuments(filter)]);
  const { page, pages, skip } = pageOf(one("page"), total, PER_PAGE);
  const products = await ProductModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(PER_PAGE).select("name skuBase category price salePrice status images").lean();
  const stock = new Map(
    (
      await VariantModel.aggregate<{ _id: unknown; total: number; low: number }>([
        { $match: { product: { $in: products.map((p) => p._id) }, isActive: true } },
        { $group: { _id: "$product", total: { $sum: "$stock" }, low: { $sum: { $cond: [{ $lte: ["$stock", lowStockThreshold] }, 1, 0] } } } },
      ])
    ).map((s) => [String(s._id), s]),
  );
  const catName = new Map(categories.map((c) => [String(c._id), c.name]));

  return (
    <>
      <PageHeader
        title="Products"
        text={`${total} product${total === 1 ? "" : "s"}${filter.status && typeof filter.status === "object" ? " (archived hidden)" : ""}`}
        actions={can(admin.role, "catalog.edit") && <Link href="/admin/products/new" className="label inline-flex h-10 items-center rounded-md bg-ink px-4 text-paper hover:bg-charcoal">Add product</Link>}
      />
      <FilterBar action="/admin/products">
        <Filter label="Search">
          <input name="q" defaultValue={params.q} placeholder="Name or SKU" className={`${filterInput} w-56`} />
        </Filter>
        <Filter label="Category">
          <select name="category" defaultValue={params.category ?? ""} className={filterInput}>
            <option value="">All</option>
            {categories.map((c) => <option key={String(c._id)} value={String(c._id)}>{c.name}</option>)}
          </select>
        </Filter>
        <Filter label="Status">
          <select name="status" defaultValue={params.status ?? ""} className={filterInput}>
            <option value="">Active + draft</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </Filter>
        <Filter label="Stock">
          <select name="stock" defaultValue={params.stock ?? ""} className={filterInput}>
            <option value="">Any</option>
            <option value="low">Low (≤ {lowStockThreshold}) in a size</option>
            <option value="out">Sold out</option>
          </select>
        </Filter>
      </FilterBar>
      <Table minWidth="52rem">
        <thead>
          <tr>
            <th className={th}>Product</th>
            <th className={th}>Category</th>
            <th className={`${th} text-right`}>Price</th>
            <th className={`${th} text-right`}>Stock</th>
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {products.length ? (
            products.map((p) => {
              const s = stock.get(String(p._id));
              const img = [...(p.images ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url;
              return (
                <tr key={String(p._id)} className="hover:bg-paper/50">
                  <td className={td}>
                    <Link href={`/admin/products/${p._id}`} className="flex items-center gap-3">
                      <Thumb src={img} className="h-14 w-11" />
                      <span>
                        <span className="font-medium hover:underline">{p.name}</span>
                        <span className="block font-mono text-xs text-muted">{p.skuBase}</span>
                      </span>
                    </Link>
                  </td>
                  <td className={td}>{catName.get(String(p.category)) ?? "—"}</td>
                  <td className={`${td} text-right tabular-nums`}>
                    {p.salePrice ? <>{formatMoney(p.salePrice)} <span className="block text-xs text-muted line-through">{formatMoney(p.price)}</span></> : formatMoney(p.price)}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>
                    {s?.total ?? 0}
                    {s && s.low > 0 && <span className="block text-xs text-warn">{s.low} size{s.low === 1 ? "" : "s"} low</span>}
                  </td>
                  <td className={td}><Badge tone={p.status === "active" ? "ok" : p.status === "draft" ? "warn" : "neutral"}>{p.status}</Badge></td>
                </tr>
              );
            })
          ) : (
            <EmptyRow cols={5} text="No products match these filters." />
          )}
        </tbody>
      </Table>
      <AdminPagination page={page} pages={pages} total={total} href={(n) => listHref("/admin/products", params, { page: n })} />
    </>
  );
}
