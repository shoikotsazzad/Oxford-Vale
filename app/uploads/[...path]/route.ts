import { readUpload } from "@/server/storage";

// Serves admin uploads from storage/uploads/ (files added to public/ after build are not served by Next.js).
export async function GET(_request: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const { path } = await ctx.params;
  const file = await readUpload(path);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
