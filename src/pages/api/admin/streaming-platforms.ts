import type { APIRoute } from "astro";
import { getKv } from "@app/lib/db";

const PREFIX = ["links", "streamingPlatforms"];

export const GET: APIRoute = async () => {
  const kv = await getKv();
  const entries = await Array.fromAsync(kv.list({ prefix: PREFIX }));
  const platforms = entries.map((e) => e.value).sort((a: any, b: any) => a.order - b.order);
  return new Response(JSON.stringify(platforms), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, redirect }) => {
  const kv = await getKv();
  const formData = await request.formData();
  const method = formData.get("_method")?.toString() || "POST";

  if (method === "PUT") {
    return handleUpdate(kv, formData, redirect);
  }
  if (method === "DELETE") {
    return handleDelete(kv, formData, redirect);
  }
  return handleCreate(kv, formData, redirect);
};

export const PUT: APIRoute = async ({ request, redirect }) => {
  const kv = await getKv();
  const formData = await request.formData();
  return handleUpdate(kv, formData, redirect);
};

export const DELETE: APIRoute = async ({ request, redirect }) => {
  const kv = await getKv();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  await kv.delete([...PREFIX, id]);
  return redirect("/admin/streaming-platforms");
};

async function handleCreate(kv: Deno.Kv, fd: FormData, redirect: any) {
  const id = crypto.randomUUID();
  const platform = {
    id,
    title: fd.get("title")?.toString() || "",
    icon: fd.get("icon")?.toString() || "",
    url: fd.get("url")?.toString() || "",
    description: fd.get("description")?.toString() || "",
    order: parseInt(fd.get("order")?.toString() || "0", 10),
  };
  await kv.set([...PREFIX, id], platform);
  return redirect("/admin/streaming-platforms");
}

async function handleUpdate(kv: Deno.Kv, fd: FormData, redirect: any) {
  const id = fd.get("id")?.toString();
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const platform = {
    id,
    title: fd.get("title")?.toString() || "",
    icon: fd.get("icon")?.toString() || "",
    url: fd.get("url")?.toString() || "",
    description: fd.get("description")?.toString() || "",
    order: parseInt(fd.get("order")?.toString() || "0", 10),
  };
  await kv.set([...PREFIX, id], platform);
  return redirect("/admin/streaming-platforms");
}

async function handleDelete(kv: Deno.Kv, fd: FormData, redirect: any) {
  const id = fd.get("id")?.toString();
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  await kv.delete([...PREFIX, id]);
  return redirect("/admin/streaming-platforms");
}
