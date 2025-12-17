const BASE_URL = process.env.STRAPI_BASE_URL || "http://localhost:1337";
import qs from "qs";

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
    const response = await fetch(`${BASE_URL}/${endpoint}`);
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
