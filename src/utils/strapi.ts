// Función para convertir objetos a query string (reemplaza qs)
function stringifyQuery(obj: any, prefix = ""): string {
  const params = new URLSearchParams();

  const flatten = (current: any, prop: string) => {
    if (current === null || current === undefined) {
      return;
    }

    if (typeof current !== "object") {
      params.append(prop, String(current));
    } else if (Array.isArray(current)) {
      current.forEach((item, i) => {
        flatten(item, `${prop}[${i}]`);
      });
    } else {
      Object.keys(current).forEach((key) => {
        const newProp = prop ? `${prop}[${key}]` : key;
        flatten(current[key], newProp);
      });
    }
  };

  flatten(obj, prefix);
  return params.toString();
}

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
  const queryString = stringifyQuery(STREAMING_PLATFORMS_QUERY);
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
