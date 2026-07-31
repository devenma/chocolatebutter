import { getKv } from "@app/lib/db.ts";
import { getCollection } from "astro:content";
import type {
  FeaturedLink,
  SocialLink,
  SpotifyArtistLink,
  StreamingPlatform,
} from "@app/lib/schemas.ts";

const SEEDED_KEY = ["meta", "seeded"];
const STREAMING_PREFIX = ["links", "streamingPlatforms"];
const ARTIST_PREFIX = ["links", "spotifyArtistLinks"];
const SOCIAL_PREFIX = ["links", "socialLinks"];
const FEATURED_KEY = ["meta", "featuredLink"];

// Serializes seeding so concurrent first renders share a single seeding pass.
// Local Deno KV (SQLite) throws "database is locked" on concurrent atomic
// commits, so only one commit may be in flight per process.
let seedPromise: Promise<void> | null = null;

function sortByOrder<T extends { order: number; title: string }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => a.order - b.order || a.title.localeCompare(b.title),
  );
}

async function listLinks<T>(prefix: string[]): Promise<T[]> {
  const kv = await getKv();
  const entries = await Array.fromAsync(kv.list({ prefix }));
  return sortByOrder(entries.map((e) => e.value as T));
}

export async function getStreamingPlatforms(): Promise<StreamingPlatform[]> {
  return await listLinks<StreamingPlatform>(STREAMING_PREFIX);
}

export async function getSpotifyArtistLinks(): Promise<SpotifyArtistLink[]> {
  return await listLinks<SpotifyArtistLink>(ARTIST_PREFIX);
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  return await listLinks<SocialLink>(SOCIAL_PREFIX);
}

export async function getFeaturedLink(): Promise<FeaturedLink | null> {
  const kv = await getKv();
  const entry = await kv.get<FeaturedLink>(FEATURED_KEY);
  return entry.value ?? null;
}

export function seedIfEmpty(): Promise<void> {
  if (!seedPromise) {
    seedPromise = doSeedIfEmpty().catch((error) => {
      // Seeding is best-effort: the page must never crash because of it.
      // Reset so the next render can retry.
      console.error("[publicData] seeding failed:", error);
      seedPromise = null;
    });
  }
  return seedPromise;
}

async function doSeedIfEmpty(): Promise<void> {
  const kv = await getKv();
  const seeded = await kv.get(SEEDED_KEY);
  if (seeded.value != null) return;

  const [streamingPlatforms, spotifyArtistLinks, socialLinks] =
    await Promise.all([
      getCollection("streamingPlatforms"),
      getCollection("spotifyArtistLinks"),
      getCollection("socialLinks"),
    ]);

  const atomic = kv.atomic().check({ key: SEEDED_KEY, versionstamp: null });

  streamingPlatforms.forEach((entry, order) => {
    const id = crypto.randomUUID();
    atomic.set([...STREAMING_PREFIX, id], {
      id,
      ...entry.data,
      order,
    });
  });

  spotifyArtistLinks.forEach((entry, order) => {
    const id = crypto.randomUUID();
    atomic.set([...ARTIST_PREFIX, id], {
      id,
      ...entry.data,
      order,
    });
  });

  socialLinks.forEach((entry, order) => {
    const id = crypto.randomUUID();
    atomic.set([...SOCIAL_PREFIX, id], {
      id,
      ...entry.data,
      order,
    });
  });

  atomic.set(SEEDED_KEY, true);

  const res = await atomic.commit();
  if (!res.ok) {
    // Another instance won the seeding race; the marker is already set.
    return;
  }
}
