import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const streamingPlatforms = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.{md,mdx}",
    base: "./src/content/streamingPlatforms",
  }),
  schema: z.object({
    title: z.string(),
    icon: z.string(),
    url: z.url(),
    description: z.string(),
  }),
});

const spotifyArtistLinks = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.{md,mdx}",
    base: "./src/content/spotifyArtistLinks",
  }),
  schema: z.object({
    title: z.string(),
    img: z.string(),
    url: z.url(),
    description: z.string(),
  }),
});

const socialLinks = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.{md,mdx}",
    base: "./src/content/socialLinks",
  }),
  schema: z.object({
    url: z.url(),
    img: z.string(),
    title: z.string(),
    alt: z.string(),
    width: z.number(),
    height: z.number(),
  }),
});

export const collections = {
  streamingPlatforms,
  spotifyArtistLinks,
  socialLinks,
};
