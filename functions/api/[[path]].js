export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // E.g., incoming request: /api/service/vneduApi/getReportTHPT?nam_hoc=2026
  // Remove the /api prefix to get the target path
  const targetPath = url.pathname.replace(/^\/api/, '');
  const targetUrl = `https://staging.tsdc.vnedu.vn${targetPath}${url.search}`;

  const newHeaders = new Headers();
  
  // Copy safe headers from the original request
  const safeHeaders = ['accept', 'accept-language', 'user-agent', 'content-type'];
  safeHeaders.forEach(header => {
    const value = request.headers.get(header);
    if (value) newHeaders.set(header, value);
  });
  
  // Set required Origin and Referer headers to bypass the block
  newHeaders.set('Origin', 'https://ninhbinh.tsdc.vnedu.vn');
  newHeaders.set('Referer', 'https://ninhbinh.tsdc.vnedu.vn/');

  const init = {
    method: request.method,
    headers: newHeaders,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  try {
    const proxyRequest = new Request(targetUrl, init);
    const response = await fetch(proxyRequest);
    
    // Return the response directly
    // Cloudflare Pages automatically handles CORS for relative paths
    return response;
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
    });
  }
}
