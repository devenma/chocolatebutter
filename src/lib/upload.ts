import { getStorage } from "@app/lib/storage.ts";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];
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

    const bytes = new Uint8Array(await file.arrayBuffer());
    const { url } = await getStorage().upload(bytes, filename, file.type);

    return { url };
  } catch (err) {
    console.error("Upload error:", err);
    return { error: "Internal server error", status: 500 };
  }
}

export async function deleteFile(
  url: string,
): Promise<{ success: boolean; error?: string }> {
  return await getStorage().deleteByUrl(url);
}
