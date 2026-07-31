import type { APIRoute } from "astro";
import { handleUpload } from "@app/lib/upload.ts";

export const POST: APIRoute = async ({ request }) => {
  const result = await handleUpload(request);

  if ("error" in result) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: ("status" in result ? result.status : 500) as number,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ url: result.url }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
