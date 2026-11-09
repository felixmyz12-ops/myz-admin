const AUTH = "myz123";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth, X-Admin, Accept",
    "Content-Type": "application/json"
  };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors() });
    }
    const auth = request.headers.get("X-Auth");
    if (auth !== AUTH) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors() });
    }
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/admin/list") {
      let pages = [];
      for (let n = 1; n <= 10; n++) {
        let v = await env.MYZ_KV.get("page_" + n);
        if (v) {
          try {
            let arr = JSON.parse(v);
            if (Array.isArray(arr) && arr.length > 0) pages.push({ page: n, count: arr.length });
          } catch (e) {}
        }
      }
      return new Response(JSON.stringify({ pages: pages }), { headers: cors() });
    }
    let m = path.match(/\/admin\/page\/(\d+)/);
    if (m && request.method === "GET") {
      let v = await env.MYZ_KV.get("page_" + m[1]);
      if (!v) return new Response(JSON.stringify([]), { headers: cors() });
      return new Response(v, { headers: cors() });
    }
    if (path === "/admin/save" && request.method === "POST") {
      let page = url.searchParams.get("page") || "1";
      let body = await request.text();
      let arr = JSON.parse(body);
      if (!Array.isArray(arr)) return new Response(JSON.stringify({ error: "body must be array" }), { status: 400, headers: cors() });
      await env.MYZ_KV.put("page_" + page, body);
      return new Response(JSON.stringify({ ok: true, page: page, count: arr.length }), { headers: cors() });
    }
    return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers: cors() });
  }
};
