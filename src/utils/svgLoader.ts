import fs from "fs";
import path from "path";

export function getSvgContent(imagePath: string) {
  try {
    const filePath = path.join(process.cwd(), "public", imagePath);
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Error loading SVG: ${imagePath}`, error);
    return null;
  }
}
