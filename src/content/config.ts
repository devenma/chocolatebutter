import { defineCollection, z } from "astro:content";

const streamingPlatforms = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    img: z.string(),
    url: z.string().url(),
    description: z.string(),
  }),
});

const spotifyArtistLinks = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    img: z.string(),
    url: z.string().url(),
    description: z.string(),
  }),
});

export const collections = { streamingPlatforms, spotifyArtistLinks };
