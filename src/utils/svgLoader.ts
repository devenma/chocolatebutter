import fs from "node:fs";
import path from "node:path";

export function getSvgContent(imagePath: string) {
  try {
    const filePath = path.join(process.cwd(), "public", imagePath);
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Error loading SVG: ${imagePath}`, error);
    return null;
  }
}

export async function getSvgContentFromStrapi(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch SVG from URL: ${url}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error loading SVG from URL: ${url}`, error);
    return null;
  }
}

export default { getSvgContent, getSvgContentFromStrapi };
