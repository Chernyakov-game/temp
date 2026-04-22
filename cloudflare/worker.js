// Cloudflare Worker — geo-based routing for evolution.new
// Deploy at: dash.cloudflare.com → Workers → Create Worker
// Then add route: evolution.new/* → this worker
//
// DNS changes needed in Namecheap:
//   @ A record → remove 89.23.106.142, point to Cloudflare nameservers
//   OR keep @ A record and enable Cloudflare proxy (orange cloud) on it

const YANDEX_MIRROR = "https://ru.evolution.new";
const READYMAG_ORIGIN = "https://evolution.new"; // ReadyMag serves this directly when proxied off

export default {
  async fetch(request, env, ctx) {
    const country = request.cf?.country;
    const url = new URL(request.url);

    if (country === "RU") {
      // Redirect Russian visitors to Yandex Cloud mirror
      const mirrorUrl = YANDEX_MIRROR + url.pathname + url.search;
      return Response.redirect(mirrorUrl, 302);
    }

    // For everyone else — fetch from ReadyMag directly (no extra hop)
    // ReadyMag URL pattern: replace host, keep path
    const readymagUrl = "https://readymag.website" + url.pathname + url.search;
    const response = await fetch(readymagUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
    });

    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  },
};
