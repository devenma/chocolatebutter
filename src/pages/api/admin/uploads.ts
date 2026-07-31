import type { APIRoute } from "astro";
import { deleteFile } from "@app/lib/upload.ts";
import { getStorage } from "@app/lib/storage.ts";

export const GET: APIRoute = async () => {
  try {
    const files = await getStorage().list();

    return new Response(JSON.stringify(files), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("List uploads error:", err);
    return new Response(JSON.stringify({ error: "Failed to list uploads" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const url = body?.url;

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing 'url' in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const result = await deleteFile(url);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.error === "File not found" ? 404 : 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("Delete upload error:", err);
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
