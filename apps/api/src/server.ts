import express, {type ErrorRequestHandler} from 'express';
import http from 'node:http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import {rateLimit} from 'express-rate-limit';
import {Server as IoServer} from 'socket.io';
import {ZodError} from 'zod';
import {connectDb} from './models.js';
import {getIdentity} from './auth.js';
import {createRoutes} from './routes.js';
import {env} from './config.js';
// Static import is necessary for Vercel's function dependency tracing.
// Some NodeNext + Vercel TypeScript combinations type the default export as a
// module namespace; cast only the known middleware factory, not the middleware.
const helmetFactory = helmet as unknown as () => express.RequestHandler;
const app=express();app.disable('x-powered-by');app.set('trust proxy',1);
const origins=env.WEB_ORIGIN.split(',').map(s=>s.trim());
app.use(helmetFactory());app.use(cors({origin:origins,methods:['GET','POST','PATCH']}));
app.use(compression());app.use(express.json({limit:'30kb'}));
app.use('/api/v1',(_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
app.use('/api/v1',rateLimit({windowMs:60*1000,limit:60,standardHeaders:'draft-8',legacyHeaders:false}));
app.use('/api/v1/contact',rateLimit({windowMs:60*60*1000,limit:5,standardHeaders:'draft-8',legacyHeaders:false}));
app.use('/api/v1/conversations',rateLimit({windowMs:60*1000,limit:25,standardHeaders:'draft-8',legacyHeaders:false}));
const server=http.createServer(app);
const io=new IoServer(server,{cors:{origin:origins,methods:['GET','POST']},transports:['websocket','polling']});
io.use(async(socket,next)=>{try{const token=socket.handshake.auth.token;if(typeof token!=='string')throw Error('Missing token');socket.data.identity=await getIdentity(token);next();}catch{next(Error('Unauthorized'));}});
io.on('connection',socket=>{
 // Require a fresh Firebase ID token for long-running live-chat sessions.
 const expiryTimer=setTimeout(()=>socket.disconnect(true),55*60*1000);
 socket.on('disconnect',()=>clearTimeout(expiryTimer));
 const user=socket.data.identity as Awaited<ReturnType<typeof getIdentity>>;
 if(user.admin)socket.join('owners');
 socket.on('conversation:join',async(id:string)=>{
  try{const {Conversation}=await import('./models.js');if(typeof id!=='string'||!/^\w{24}$/.test(id))return;const convo=await Conversation.findById(id);
   if(convo && (convo.participantUid===user.uid||user.admin))socket.join(`conversation:${id}`);
  }catch(e){console.error('Join failed:',e);}
 });
});
// Vercel Functions start on demand. Ensure Atlas is connected before each API route.
// Local development still establishes the connection before opening its port.
app.use('/api/v1',async(_req,_res,next)=>{
 try { await connectDb(); next(); }
 catch(error){
  const dbError=error as {name?:string;code?:number|string;message?:string;reason?:{type?:string}};
  const message=typeof dbError?.message==='string'?dbError.message:'';
  const kind=dbError?.code===18 || /authenticat|bad auth|credentials/i.test(message)?'AUTH'
    : /querysrv|dns|enotfound|eai_again|eservfail/i.test(message)?'DNS'
    : /tls|ssl|certificate/i.test(message)?'TLS'
    : /server selection|timed out|econnrefused|replicaset|no primary|could not connect/i.test(message)?'NETWORK'
    : 'OTHER';
  // Never log the Atlas connection string, username, password or raw error text.
  console.error('[API] MongoDB connection failed', {kind, name:dbError?.name||'UnknownError', code:typeof dbError?.code==='number'?dbError.code:undefined});
  next(Object.assign(new Error('Database connection temporarily unavailable.'),{status:503,code:'DATABASE_UNAVAILABLE'}));
 }
});
app.use('/api/v1',createRoutes(io));
app.use((_req,res)=>res.status(404).json({error:'Route not found'}));
const errors:ErrorRequestHandler=(err,req,res,_next)=>{
 const status=err instanceof ZodError?400:typeof err.status==='number'?err.status:500;
 const code=typeof err.code==='string' && /^[A-Z_]{3,50}$/.test(err.code)?err.code:undefined;
 if(status===500)console.error('Unhandled API error:',err);
 res.status(status).json({error:err instanceof ZodError?'Invalid request: '+err.issues.map(i=>i.path.join('.')+': '+i.message).join('; '):status===500?'Unexpected server error':err.message, ...(code?{code}:{})});
};app.use(errors);
server.on('error',(error:NodeJS.ErrnoException)=>{
 if(error.code==='EADDRINUSE') console.error(`[API] Port ${env.PORT} is in use. Stop the older API process before starting another.`);
 else console.error('[API] HTTP listener failed:',error);
 process.exitCode=1;
});
// Vercel invokes the exported Express handler. A local listener is only for Node dev.
if (!process.env.VERCEL) {
 if (process.env.RENDER) {
  // Free Render instances must bind to the assigned port to accept a cold-start request.
  // Per-request middleware connects to Atlas and reports 503 until access is configured.
  // Listen on 0.0.0.0; do not block startup on Atlas allowlisting.
  server.listen(env.PORT,'0.0.0.0',()=>console.log(`API listening on ${env.PORT} (Render)`));
 } else {
  connectDb().then(()=>server.listen(env.PORT,()=>console.log(`API listening on ${env.PORT}`)))
    .catch(error=>{console.error('Database connection failed:',error instanceof Error?error.name:'unknown');process.exitCode=1;});
 }
}

// Export Express directly for Vercel's recognized src/server.ts entry point.
export default app;
