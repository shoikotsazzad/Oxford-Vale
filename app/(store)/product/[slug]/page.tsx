import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getT } from "@/server/i18n";
import { getSettings } from "@/server/services/settings";
import { getProductBySlug, getRelatedProducts } from "@/server/services/catalog";
import { buildMetadata } from "@/lib/seo";
import { fmt, type Dict } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { sizeTypeLabel } from "@/lib/size-ranges";
import { mailtoLink } from "@/lib/contact";
import { site } from "@/data/site";
import type { SizeType } from "@/models/enums";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProductGridSkeleton, ProductSkeleton } from "@/components/ui/Skeleton";
import { MailIcon } from "@/components/ui/icons";
import { Gallery } from "@/components/store/Gallery";
import { PurchasePanel } from "@/components/store/PurchasePanel";
import { ProductRow } from "@/components/store/ProductRow";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">) {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  return buildMetadata({
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.description.slice(0, 160),
    path: `/product/${product.slug}`,
    image: product.images[0]?.url,
  });
}

// Params and search params are read inside Suspense so navigation shows the skeleton instantly.
export default function ProductPage(props: PageProps<"/product/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductPageContent {...props} />
    </Suspense>
  );
}

async function ProductPageContent({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const [product, t, settings] = await Promise.all([getProductBySlug(slug), getT(), getSettings()]);
  if (!product) notFound();

  const effective = product.salePrice ?? product.price;
  const details = [
    { title: t.product.description, body: product.description, open: true },
    { title: t.product.fabric, body: product.fabric },
    { title: t.product.care, body: product.careNotes },
    { title: t.product.delivery, body: fmt(t.product.deliveryNote, { amount: formatMoney(settings.freeDeliveryThreshold) }) },
  ].filter((d) => d.body);

  return (
    <>
      <Container className="py-6 md:py-10">
        <Breadcrumbs
          items={[
            { label: t.common.home, href: "/" },
            { label: product.category, href: `/shop/${product.categorySlug}` },
            { label: product.name },
          ]}
        />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <Gallery images={product.images} name={product.name} />

          <div className="lg:sticky lg:top-28 lg:self-start">
            {product.collections.length > 0 && <p className="label text-muted">{product.collections.map((c) => c.name).join(" · ")}</p>}
            <h1 className="mt-2 font-serif text-3xl leading-tight md:text-4xl">{product.name}</h1>
            <div className="mt-5">
              <PurchasePanel
                productId={product.id}
                price={product.price}
                salePrice={product.salePrice}
                variants={product.variants}
                sizeLabel={product.sizeType === "one-size" ? t.product.size : sizeTypeLabel[product.sizeType as SizeType]}
                lowStockThreshold={settings.lowStockThreshold}
              />
            </div>

            <a
              href={mailtoLink(settings.contact.email, `Question about ${product.name} (${product.skuBase})`)}
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm underline-offset-4 hover:underline"
            >
              <MailIcon size={18} /> {t.product.ask}
            </a>

            <div className="mt-8 divide-y divide-line border-y border-line">
              {details.map((d) => (
                <details key={d.title} open={d.open} className="group py-4">
                  <summary className="label flex min-h-8 cursor-pointer list-none items-center justify-between">
                    {d.title}
                    <span className="text-lg leading-none transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink/80">{d.body}</p>
                </details>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">{t.product.sku}: {product.skuBase}</p>
          </div>
        </div>
      </Container>

      <Suspense fallback={<Container className="py-12"><ProductGridSkeleton count={5} /></Container>}>
        <Related productId={product.id} categoryId={product.categoryId} t={t} />
      </Suspense>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          sku: product.skuBase,
          brand: { "@type": "Brand", name: settings.storeName },
          category: product.category,
          material: product.fabric,
          ...(product.images.length && { image: product.images.map((i) => new URL(i.url, site.url).toString()) }),
          offers: {
            "@type": "Offer",
            url: `${site.url}/product/${product.slug}`,
            priceCurrency: "BDT",
            price: effective,
            availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
          },
        }}
      />
    </>
  );
}

async function Related({ productId, categoryId, t }: { productId: string; categoryId: string; t: Dict }) {
  const products = await getRelatedProducts(productId, categoryId);
  return <ProductRow title={t.product.related} products={products} t={t} />;
}
