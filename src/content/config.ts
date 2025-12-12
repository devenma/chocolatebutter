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

const socialLinks = defineCollection({
  type: "content",
  schema: z.object({
    url: z.string().url(),
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
