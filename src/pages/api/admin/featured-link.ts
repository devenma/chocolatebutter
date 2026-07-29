import type { APIRoute } from "astro";
import { getKv } from "@app/lib/db";

const KEY = ["meta", "featuredLink"];

export const GET: APIRoute = async () => {
  const kv = await getKv();
  const entry = await kv.get(KEY);
  return new Response(JSON.stringify(entry.value || null), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, redirect }) => {
  const kv = await getKv();
  const formData = await request.formData();
  const method = formData.get("_method")?.toString() || "POST";

  if (method === "PUT") {
    return handleUpsert(kv, formData, redirect);
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ request, redirect }) => {
  const kv = await getKv();
  const formData = await request.formData();
  return handleUpsert(kv, formData, redirect);
};

async function handleUpsert(kv: Deno.Kv, fd: FormData, redirect: any) {
  const title = fd.get("title")?.toString();
  const url = fd.get("url")?.toString();
  const coverImage = fd.get("coverImage")?.toString();
  const description = fd.get("description")?.toString() || "";

  if (!title || !url || !coverImage) {
    return redirect(
      "/admin/featured-link?error=Title%2C%20URL%2C%20and%20Cover%20Image%20are%20required",
    );
  }

  const featured = { title, url, coverImage, description };
  await kv.set(KEY, featured);
  return redirect("/admin/featured-link?message=Featured%20link%20updated");
}
