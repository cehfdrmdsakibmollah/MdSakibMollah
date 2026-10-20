import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
const root=process.cwd();
const src=(name)=>readFileSync(path.join(root,name),'utf8');
assert.equal(JSON.parse(src('apps/api/package.json')).type,'module');
assert.equal(JSON.parse(src('apps/web/package.json')).type,'module');
assert(src('apps/web/postcss.config.mjs').includes('export default'));
assert.equal(JSON.parse(src('apps/api/tsconfig.json')).compilerOptions.module,'NodeNext');
assert(src('apps/web/src/lib/api.ts').includes("apiOrigin='/api/backend'"));
assert(src('apps/web/src/app/api/backend/[...path]/route.ts').includes("NextResponse.json"));
assert(src('apps/web/src/components/chat-widget.tsx').includes('not sent'));
assert(src('apps/web/src/lib/site.ts').includes('https://www.google.com/maps/embed?pb='));
for(const file of ['apps/web/public/creative-it-react-certificate.pdf','apps/web/public/images/sakib-client-photo.webp','apps/web/src/app/contact/page.tsx','apps/api/src/assistant.ts'])assert(existsSync(path.join(root,file)),file+' missing');
for(const term of ['MONGODB_PASSWORD=',['BEGIN','PRIVATE','KEY'].join(' ')]){
  for(const file of ['apps/api/.env.example','apps/web/.env.example','README.md'])assert(!src(file).includes(term),term+' exposed in '+file);
}
console.log('PASS: ESM, chatbot proxy, Google Maps, assets and basic secrets checks.');
