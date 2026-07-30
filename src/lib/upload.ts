import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const EXT_MAP: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

interface UploadResult {
  url: string;
}

interface UploadError {
  error: string;
  status: number;
}

export async function handleUpload(
  request: Request,
): Promise<UploadResult | UploadError> {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return { error: "No file provided", status: 400 };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        error: `Invalid file type: ${file.type}. Allowed: png, jpg, webp, svg`,
        status: 400,
      };
    }

    if (file.size > MAX_SIZE) {
      return {
        error: `File too large: ${file.size} bytes. Max: 5 MB`,
        status: 413,
      };
    }

    const ext = EXT_MAP[file.type];
    const filename = `${crypto.randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, filename);

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return { url: `/uploads/${filename}` };
  } catch (err) {
    console.error("Upload error:", err);
    return { error: "Internal server error", status: 500 };
  }
}

export async function deleteFile(
  url: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const filename = path.basename(url);
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, filename);

    const resolved = path.resolve(filePath);
    const resolvedDir = path.resolve(uploadDir);
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
}
