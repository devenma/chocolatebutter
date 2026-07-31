// Memoized Deno.Kv singleton
// Production: uses implicit Deno Deploy global KV
// Dev: respects DENO_KV_PATH env var for local persistence

let _kvPromise: Promise<Deno.Kv> | null = null;

export function getKv(): Promise<Deno.Kv> {
  if (!_kvPromise) {
    _kvPromise = (async () => {
      const path = Deno.env.get("DENO_KV_PATH");
      return await Deno.openKv(path);
    })();
  }
  return _kvPromise;
}
