// Cloudflare Pages Function — proxies task-extraction requests to the
// Anthropic API. Keeps ANTHROPIC_API_KEY server-side (set as a Pages
// secret — see README.md). The browser only ever calls /api/extract.

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    if (!body.prompt) {
      return new Response('Missing "prompt" in body', { status: 400 });
    }
    if (!env.ANTHROPIC_API_KEY) {
      return new Response('ANTHROPIC_API_KEY is not configured on this Pages project', { status: 500 });
    }

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: body.prompt }],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return new Response('Anthropic API error: ' + JSON.stringify(data), { status: resp.status });
    }
    return Response.json(data);
  } catch (err) {
    return new Response('Proxy error: ' + err.message, { status: 500 });
  }
}
