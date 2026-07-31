import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StoredFile {
  name: string;
  url: string;
  size: string;
  sizeBytes: number;
  type: string;
  lastModified: string;
}

export interface StorageBackend {
  upload(
    bytes: Uint8Array,
    name: string,
    contentType: string,
  ): Promise<{ url: string }>;
  deleteByUrl(url: string): Promise<{ success: boolean; error?: string }>;
  list(): Promise<StoredFile[]>;
}

export const MIME_MAP: Record<string, string> = {
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

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getMime(ext: string): string {
  return MIME_MAP[ext.toLowerCase()] || "application/octet-stream";
}

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function sortByLastModifiedDesc(a: StoredFile, b: StoredFile): number {
  return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Storage: missing required env var ${name} for r2 backend`);
  }
  return value;
}

const localBackend: StorageBackend = {
  async upload(bytes, name) {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), bytes);
    return { url: `/uploads/${name}` };
  },

  async deleteByUrl(url) {
    try {
      const filename = path.basename(url);
      const filePath = path.join(UPLOAD_DIR, filename);

      const resolved = path.resolve(filePath);
      const resolvedDir = path.resolve(UPLOAD_DIR);
      if (!resolved.startsWith(resolvedDir)) {
        return { success: false, error: "Invalid file path" };
      }

      await unlink(filePath);
      return { success: true };
    } catch (err) {
      if ((err as { code?: string }).code === "ENOENT") {
        return { success: false, error: "File not found" };
      }
      console.error("Delete error:", err);
      return { success: false, error: "Internal server error" };
    }
  },

  async list() {
    let names: string[];
    try {
      names = await readdir(UPLOAD_DIR);
    } catch (err) {
      if ((err as { code?: string }).code === "ENOENT") {
        return [];
      }
      throw err;
    }

    const files = await Promise.all(
      names
        .filter((name) => !name.startsWith("."))
        .map(async (name) => {
          const filePath = path.join(UPLOAD_DIR, name);
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

    return files.sort(sortByLastModifiedDesc);
  },
};

let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3Client) {
    const config: S3ClientConfig = {
      region: "auto",
      endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      },
    };
    _s3Client = new S3Client(config);
  }
  return _s3Client;
}

function getPublicUrl(): string {
  return requireEnv("R2_PUBLIC_URL").replace(/\/+$/, "");
}

function getBucket(): string {
  return requireEnv("R2_BUCKET");
}

const r2Backend: StorageBackend = {
  async upload(bytes, name, contentType) {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: getBucket(),
        Key: name,
        Body: bytes,
        ContentType: contentType,
      }),
    );
    return { url: `${getPublicUrl()}/${name}` };
  },

  async deleteByUrl(url) {
    try {
      const client = getS3Client();
      const publicUrl = getPublicUrl();

      let key: string;
      if (url.startsWith(publicUrl)) {
        key = new URL(url).pathname.replace(/^\/+/, "");
      } else if (url.startsWith("/uploads/")) {
        key = path.basename(url);
      } else {
        return { success: false, error: "Invalid file path" };
      }

      if (!key) {
        return { success: false, error: "Invalid file path" };
      }

      await client.send(
        new DeleteObjectCommand({ Bucket: getBucket(), Key: key }),
      );
      return { success: true };
    } catch (err) {
      console.error("Delete error:", err);
      return { success: false, error: "Internal server error" };
    }
  },

  async list() {
    const client = getS3Client();
    const result = await client.send(
      new ListObjectsV2Command({ Bucket: getBucket() }),
    );

    const contents = result.Contents ?? [];
    const files: StoredFile[] = contents
      .filter((item) => item.Key && !item.Key.startsWith("."))
      .map((item) => {
        const key = item.Key!;
        const sizeBytes = item.Size ?? 0;
        return {
          name: key,
          url: `${getPublicUrl()}/${key}`,
          size: formatSize(sizeBytes),
          sizeBytes,
          type: getMime(path.extname(key)),
          lastModified: item.LastModified
            ? new Date(item.LastModified).toISOString()
            : new Date(0).toISOString(),
        };
      });

    return files.sort(sortByLastModifiedDesc);
  },
};

export function getStorage(): StorageBackend {
  const driver = Deno.env.get("UPLOAD_STORAGE") ?? "local";
  return driver === "r2" ? r2Backend : localBackend;
}
