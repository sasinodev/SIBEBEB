import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

function sibebebApiPlugin(): Plugin {
  return {
    name: 'sibebeb-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = req.url.split('?')[0];

        // Parse JSON body
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {};
            const { handleChat, handleTTS, handleQuickSentiment, handleVisionChat } = await import('./server/api.ts');

            res.setHeader('Content-Type', 'application/json');

            if (url === '/api/chat') {
              const result = await handleChat(parsedBody);
              res.end(JSON.stringify(result));
            } else if (url === '/api/vision-chat') {
              const result = await handleVisionChat(parsedBody);
              res.end(JSON.stringify(result));
            } else if (url === '/api/tts') {
              const result = await handleTTS(parsedBody);
              res.end(JSON.stringify(result));
            } else if (url === '/api/sentiment') {
              const result = await handleQuickSentiment(parsedBody.text || '');
              res.end(JSON.stringify(result));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Endpoint not found' }));
            }
          } catch (err: any) {
            console.error('API Error in dev middleware:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err?.message || 'Server error' }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), sibebebApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

