export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    const url = new URL(request.url);
    
    // We only want to forward the path and query string.
    // For example: https://your-worker.workers.dev/service/vneduApi/getReportTHPT?nam_hoc=2026
    const targetPath = url.pathname === '/' ? '/service/vneduApi/getReportTHPT' : url.pathname;
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
      
      // Clone the response to modify headers
      const newResponse = new Response(response.body, response);
      
      // Allow your Vercel frontend to read the response
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      
      return newResponse;
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
