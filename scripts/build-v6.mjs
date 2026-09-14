import {build} from 'esbuild';import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
await mkdir('artifacts',{recursive:true});await mkdir('dist-v6/assets',{recursive:true});
await build({entryPoints:['frontend/src/app/App.tsx'],bundle:true,minify:true,target:['es2022'],outfile:'dist-v6/assets/platform.js',define:{'process.env.NODE_ENV':'"production"'},metafile:true}).then(r=>writeFile('artifacts/frontend-v6-build.json',JSON.stringify(r.metafile,null,2)));
await copyFile('frontend/index.php','dist-v6/index.php');await mkdir('dist-v6/config',{recursive:true});await copyFile('config/supabase.php','dist-v6/config/supabase.php');await copyFile('.htaccess','dist-v6/.htaccess');console.log('v6 built: dist-v6');
