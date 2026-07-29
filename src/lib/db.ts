// Memoized Deno.Kv singleton
// Production: uses implicit Deno Deploy global KV
// Dev: respects DENO_KV_PATH env var for local persistence

let _kv: Deno.Kv | null = null;

export async function getKv(): Promise<Deno.Kv> {
  if (!_kv) {
    const path = Deno.env.get("DENO_KV_PATH");
    _kv = await Deno.openKv(path);
  }
  return _kv;
}
