import {defineConfig} from 'vite';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig(({mode})=>({root,server:{host:'0.0.0.0',allowedHosts:['terminal.local']},esbuild:{jsx:'automatic'},resolve:{alias:mode==='qa'?[{find:/^(\.\.\/api\/client|\.\/client)$/,replacement:root+'qa/client.ts'}]:[]}}));
