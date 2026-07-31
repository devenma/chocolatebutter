import { z } from "astro/zod";

export const StreamingPlatformSchema = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string(),
  url: z.url(),
  description: z.string(),
  order: z.number().default(0),
});

export const SpotifyArtistLinkSchema = z.object({
  id: z.string(),
  title: z.string(),
  img: z.string(),
  url: z.url(),
  description: z.string(),
  order: z.number().default(0),
});

export const SocialLinkSchema = z.object({
  id: z.string(),
  url: z.url(),
  img: z.string(),
  title: z.string(),
  alt: z.string(),
  width: z.number().default(32),
  height: z.number().default(32),
  order: z.number().default(0),
});

export const FeaturedLinkSchema = z.object({
  title: z.string(),
  url: z.url(),
  coverImage: z.string(),
  description: z.string(),
});

export type StreamingPlatform = z.infer<typeof StreamingPlatformSchema>;
export type SpotifyArtistLink = z.infer<typeof SpotifyArtistLinkSchema>;
export type SocialLink = z.infer<typeof SocialLinkSchema>;
export type FeaturedLink = z.infer<typeof FeaturedLinkSchema>;
