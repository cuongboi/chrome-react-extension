import { type ServerWebSocket } from 'bun';

export const CHANNEL = 'reload-extension';
const PORT = 8080;
const LISTEN_PATH = '/listen';

// WebSocket server configuration
export const server = Bun.serve({
  port: PORT,

  fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === LISTEN_PATH) {
      const success = server.upgrade(req);
      return success
        ? undefined
        : new Response('WebSocket upgrade failed', { status: 400 });
    }

    return new Response('Hello, world!', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  },

  websocket: {
    open(ws: ServerWebSocket) {
      try {
        ws.subscribe(CHANNEL);
        console.log(`Client connected and subscribed to ${CHANNEL}`);
      } catch (error) {
        console.error(`Error in open: ${error}`);
      }
    },

    message(ws: ServerWebSocket, message: string | Buffer) {
      try {
        const msgStr =
          typeof message === 'string'
            ? message
            : new TextDecoder().decode(message);

        server.publish(CHANNEL, msgStr);
        console.log(`Message published to ${CHANNEL}: ${msgStr}`);
      } catch (error) {
        console.error(`Error in message handler: ${error}`);
      }
    },

    close(ws: ServerWebSocket) {
      try {
        ws.unsubscribe(CHANNEL);
        console.log(`Client unsubscribed from ${CHANNEL}`);
      } catch (error) {
        console.error(`Error in close: ${error}`);
      }
    },
  },

  // Error handling for the server itself
  error(error) {
    return new Response(`Server error: ${error.message}`, { status: 500 });
  },
});

// Log server startup
console.log(`WebSocket server running on ws://localhost:${PORT}${LISTEN_PATH}`);
