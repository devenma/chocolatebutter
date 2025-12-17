// @ts-expect-error - qs is a valid import
import qs from "qs";

// Compatible con desarrollo (import.meta.env) y Deno (Deno.env.get)
const getEnv = (key: string, defaultValue: string = ""): string => {
  // @ts-expect-error - Deno is available in Deno runtime
  if (typeof Deno !== "undefined") {
    // @ts-expect-error - Deno.env is available in Deno runtime
    return Deno.env.get(key) || defaultValue;
  }
  return (import.meta.env as Record<string, string>)[key] || defaultValue;
};

const BASE_URL = getEnv("PUBLIC_STRAPI_API_URL", "http://localhost:1337");

const STRAPI_API_TOKEN = getEnv("STRAPI_API_TOKEN", "");
const STREAMING_PLATFORMS_QUERY = {
  populate: {
    icon: {
      fields: ["url", "alternativeText"],
    },
  },
};

export async function getStreamingPlatforms() {
  const queryString = qs.stringify(STREAMING_PLATFORMS_QUERY);
  return getStrapiData(`api/streaming-platform-links?${queryString}`);
}

export async function getStrapiData(endpoint: string) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (STRAPI_API_TOKEN) {
      headers.Authorization = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const response = await fetch(`${BASE_URL}/${endpoint}`, { headers });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch data from Strapi: ${response.statusText}`
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}
