import { handleApiRequest } from './routes.js';
import type { Env } from './types.js';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, url);
    }
    if (url.pathname === '/admin') {
      url.pathname = '/admin/index.html';
      if (!env.ASSETS) throw new Error('ASSETS binding unavailable');
      return env.ASSETS.fetch(new Request(url.href, request));
    }
    if (!env.ASSETS) throw new Error('ASSETS binding unavailable');
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
