export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    const url = new URL(request.url);
    
    // The path is passed via the 'path' query parameter from vercel.json
    const pathParam = url.searchParams.get('path');
    
    if (!pathParam) {
      return new Response(JSON.stringify({ error: "Missing path parameter" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetPath = `/${pathParam}`;
    
    // Remove the 'path' parameter so it doesn't get sent to the target API
    url.searchParams.delete('path');
    const targetUrl = `https://staging.tsdc.vnedu.vn${targetPath}${url.search}`;

    // Create fresh headers to avoid passing forbidden/Vercel internal headers
    const newHeaders = new Headers();
    
    // Pass standard safe headers if they exist
    const safeHeaders = ['accept', 'accept-language', 'user-agent', 'content-type'];
    safeHeaders.forEach(header => {
      const value = request.headers.get(header);
      if (value) newHeaders.set(header, value);
    });
    
    // Set required headers for the target API
    newHeaders.set('Origin', 'https://ninhbinh.tsdc.vnedu.vn');
    newHeaders.set('Referer', 'https://ninhbinh.tsdc.vnedu.vn/');

    const init = {
      method: request.method,
      headers: newHeaders,
      redirect: 'manual',
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body; // Can be ReadableStream in Edge
    }

    const proxyRequest = new Request(targetUrl, init);

    const response = await fetch(proxyRequest);
    return response;
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
