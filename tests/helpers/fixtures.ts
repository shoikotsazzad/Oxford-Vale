import { CategoryModel, ProductModel, VariantModel } from "@/models";

/** One category, one product (sale price 800, regular 1000) with sizes M (stock 3) and L (stock 0). */
export async function seedProduct() {
  const category = await CategoryModel.create({ name: "Shirts", slug: "shirts" });
  const product = await ProductModel.create({
    name: "Test Oxford Shirt", slug: "test-oxford-shirt", skuBase: "OV-TST-001", category: category._id,
    price: 1000, salePrice: 800, sizeType: "alpha", status: "active",
  });
  const [m, l] = await VariantModel.create([
    { product: product._id, sku: "OV-TST-001-WHI-M", size: "M", colour: "White", stock: 3 },
    { product: product._id, sku: "OV-TST-001-WHI-L", size: "L", colour: "White", stock: 0 },
  ]);
  return { category, product, m, l };
}
