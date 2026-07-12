// Cloudflare Pages Function — backs the app's storage with Workers KV.
// Requires a KV namespace bound as `LEDGER_KV` (see README.md).
//
// GET    /api/kv?key=journal:2026-07-12        -> { key, value }
// GET    /api/kv?list=journal:                 -> { keys: [...] }
// POST   /api/kv   { key, value }               -> { key, value }
// DELETE /api/kv?key=journal:2026-07-12        -> { key, deleted: true }

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const listPrefix = url.searchParams.get('list');
  const key = url.searchParams.get('key');

  try {
    if (listPrefix !== null) {
      const result = await env.LEDGER_KV.list({ prefix: listPrefix });
      return Response.json({ keys: result.keys.map((k) => k.name) });
    }
    if (!key) {
      return new Response('Missing "key" query param', { status: 400 });
    }
    const value = await env.LEDGER_KV.get(key);
    if (value === null) {
      return new Response('Not found', { status: 404 });
    }
    return Response.json({ key, value });
  } catch (err) {
    return new Response('KV error: ' + err.message, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    if (!body.key) {
      return new Response('Missing "key" in body', { status: 400 });
    }
    await env.LEDGER_KV.put(body.key, body.value ?? '');
    return Response.json({ key: body.key, value: body.value ?? '' });
  } catch (err) {
    return new Response('KV error: ' + err.message, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  try {
    if (!key) {
      return new Response('Missing "key" query param', { status: 400 });
    }
    await env.LEDGER_KV.delete(key);
    return Response.json({ key, deleted: true });
  } catch (err) {
    return new Response('KV error: ' + err.message, { status: 500 });
  }
}
