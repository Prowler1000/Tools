/* eslint-disable @typescript-eslint/no-explicit-any */
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

/** @type {import('vite').Plugin} */
const viteServerConfig = () => ({
    name: 'add-headers',
    configureServer: (server: { middlewares: { use: (arg0: (req: any, res: any, next: any) => void) => void; }; }) => {
        server.middlewares.use((req: any, res: { setHeader: (arg0: string, arg1: string) => void; }, next: () => void) => {
            res.setHeader("Access-Control-Allow-Methods", "GET");
            res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
            res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
            next();
        });
    }
});

export default defineConfig({
	plugins: [sveltekit(), viteServerConfig()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
