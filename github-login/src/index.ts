import type { ExecutionContext } from '@cloudflare/workers-types';

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npx wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npx wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// These initial Types are based on bindings that don't exist in the project yet,
// you can follow the links to learn how to implement them.

export interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

export const worker = {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Redirect to GitHub OAuth login
    if (path === '/login') {
      const clientId = env.GITHUB_CLIENT_ID; // Secret injected by Wrangler
      const redirectUri = `${url.origin}/callback`;
      const scope = 'repo'; // Request manage repo scope
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
      return Response.redirect(githubAuthUrl, 302);
    }

    // Handle OAuth callback
    if (path === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) return new Response('Missing code', { status: 400 });

      const clientId = env.GITHUB_CLIENT_ID;
      const clientSecret = env.GITHUB_CLIENT_SECRET;
      const tokenResponse = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
          }),
        },
      );

      const tokenData = await tokenResponse.json();
      if (tokenData.error)
        return new Response(tokenData.error_description, { status: 400 });

      const accessToken = tokenData.access_token;
      // You can now use this token to interact with GitHub API (e.g., manage repos)
      return new Response(
        `
    <!DOCTYPE html>
    <html>
    <body>
      OK
      <script>
        if (window.opener) {
          window.opener.postMessage({ accessToken: '${accessToken}' }, '*');
          window.close();
        }
      </script>
    </body>
    </html>
  `,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        },
      );
    }

    // Default response
    return new Response('Welcome! Go to /login to authenticate.', {
      status: 200,
    });
  },
};

export default worker;
