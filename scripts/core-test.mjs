import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  await server.ssrLoadModule('/__tests__/core.spec.ts');
} finally {
  await server.close();
}
