import type { APIRoute } from "astro";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { deleteFile } from "@app/lib/upload.ts";

const MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".zip": "application/zip",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMime(ext: string): string {
  return MIME_MAP[ext.toLowerCase()] || "application/octet-stream";
}

export const GET: APIRoute = async () => {
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    let names: string[];
    try {
      names = await readdir(uploadDir);
    } catch (err) {
      if ((err as { code?: string }).code === "ENOENT") {
        return new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" },
        });
      }
      throw err;
    }

    const files = await Promise.all(
      names
        .filter((name) => !name.startsWith("."))
        .map(async (name) => {
          const filePath = path.join(uploadDir, name);
          const stats = await stat(filePath);
          const ext = path.extname(name);
          return {
            name,
            url: `/uploads/${name}`,
            size: formatSize(stats.size),
            sizeBytes: stats.size,
            type: getMime(ext),
            lastModified: stats.mtime.toISOString(),
          };
        }),
    );

    files.sort(
      (a, b) =>
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
    );

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
