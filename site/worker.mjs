// Read only Cloudflare-provided location data; never trust client-supplied city headers.
export function approximateLocation(cf = {}) {
  const country = typeof cf.country === "string" ? cf.country : null;
  const city =
    country === "IN" && typeof cf.city === "string"
      ? cf.city
          .trim()
          .slice(0, 80)
          .replace(/[\u0000-\u001f\u007f]/g, "")
      : null;
  return { city: city || null, country };
}
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== "/api/location")
      return env.ASSETS.fetch(request);
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
      "X-Content-Type-Options": "nosniff",
    };
    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response(null, {
        status: 405,
        headers: { ...headers, Allow: "GET, HEAD" },
      });
    }
    return new Response(
      request.method === "HEAD"
        ? null
        : JSON.stringify(approximateLocation(request.cf)),
      { headers },
    );
  },
};
