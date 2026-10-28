// Keeps the denormalised filter fields on Product (colours, sizes, minPrice, inStock) in sync with its variants.
// Call after any variant or price change. Used by the seed and the admin product editor.
import type { Types } from "mongoose";
import { ProductModel } from "@/models/Product";
import { VariantModel } from "@/models/Variant";

export async function syncProductSummary(productId: Types.ObjectId | string) {
  const product = await ProductModel.findById(productId).select("price salePrice").lean();
  if (!product) return;
  const variants = await VariantModel.find({ product: productId, isActive: true }).sort({ sortOrder: 1 }).lean();
  const base = product.salePrice ?? product.price;
  const prices = variants.map((v) => v.priceOverride ?? base);
  await ProductModel.updateOne(
    { _id: productId },
    {
      colours: [...new Set(variants.map((v) => v.colour))],
      sizes: [...new Set(variants.map((v) => v.size))],
      minPrice: prices.length ? Math.min(...prices) : base,
      inStock: variants.some((v) => v.stock > 0),
    },
  );
}
