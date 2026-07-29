import type { APIRoute } from "astro";
import { handleUpload } from "@app/lib/upload";

export const POST: APIRoute = async ({ request }) => {
  const result = await handleUpload(request);

  if ("error" in result) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: ("status" in result ? result.status : 500) as number,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Return HTML with the URL and a JS snippet to copy it
  return new Response(
    `<!DOCTYPE html>
<html><body>
  <script>
    const url = ${JSON.stringify(result.url)};
    navigator.clipboard?.writeText(url);
    location.href = "/admin/featured-link?message=Uploaded%3A%20${encodeURIComponent(result.url)}%20(copied%20to%20clipboard)";
  </script>
</body></html>`,
    {
      status: 201,
      headers: { "Content-Type": "text/html" },
    },
  );
};
