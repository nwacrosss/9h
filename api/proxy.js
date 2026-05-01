export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  
  // Replace the domain with the target domain and remove the /api prefix
  const targetPath = url.pathname.replace(/^\/api/, '');
  const targetUrl = `https://staging.tsdc.vnedu.vn${targetPath}${url.search}`;

  // Clone headers
  const newHeaders = new Headers(request.headers);
  
  // Delete host and connection headers so fetch sets them correctly
  newHeaders.delete('host');
  newHeaders.delete('connection');
  
  // Set required headers for the target API as configured in Vite proxy
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

  const proxyRequest = new Request(targetUrl, init);

  try {
    const response = await fetch(proxyRequest);
    return response;
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
