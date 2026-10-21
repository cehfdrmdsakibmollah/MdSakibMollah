import {Router} from 'express';
import {z} from 'zod';
import mongoose from 'mongoose';
import {rateLimit} from 'express-rate-limit';
import {Lead,Conversation,Message,Feedback} from './models.js';
import {requireAuth,requireAdmin} from './auth.js';
import {assistantReply,publicFaqReply} from './assistant.js';
import {sendEmail} from './notifications.js';
import {env} from './config.js';
import type {Server as IoServer} from 'socket.io';
const clean=z.string().trim();
const contactSchema=z.object({name:clean.min(2).max(90),email:z.email().max(254),company:clean.max(100).default(''),service:clean.max(100).default(''),budget:clean.max(80).default(''),message:clean.min(10).max(4000),website:z.string().max(200).optional()});
const messageSchema=z.object({text:clean.min(1).max(2000)});
const feedbackSchema=z.object({rating:z.number().int().min(1).max(5),comment:clean.max(600).default('')});
const objectId=(id:string)=>{if(!mongoose.isValidObjectId(id))throw Object.assign(new Error('Invalid conversation id'),{status:400});return id;};
const asError=(s:string,status:number)=>Object.assign(new Error(s),{status});
export function createRoutes(io:IoServer){
 const api=Router();
 api.get('/health',(_req,res)=>{
   const connected=mongoose.connection.readyState===1;
   res.status(connected?200:503).json({status:connected?'ok':'degraded',service:'sakib-portfolio-api',database:connected?'connected':'unavailable'});
 });
 api.post('/contact',async(req,res)=>{
   const data=contactSchema.parse(req.body); if(data.website){res.status(200).json({ok:true});return;}
   const {website,...safe}=data; const lead=await Lead.create(safe);
   // Wait for provider acceptance (up to the timeout in notifications.ts).
   // The inquiry remains stored even when email delivery is unavailable.
   const [ownerAccepted,clientAccepted]=await Promise.all([
     env.OWNER_NOTIFICATION_EMAIL
       ? sendEmail(env.OWNER_NOTIFICATION_EMAIL,`New portfolio inquiry: ${safe.name}`,`${safe.name} (${safe.email})\nCompany: ${safe.company}\nService: ${safe.service}\nBudget: ${safe.budget}\n\n${safe.message}`)
       : Promise.resolve(false),
     sendEmail(safe.email,'We received your project inquiry',`Hi ${safe.name},\nThanks for contacting MD Sakib Mollah. Your inquiry has been received. Sakib will review it and respond personally; this is an automated confirmation.`)
   ]);
   // These booleans mean provider ACCEPTED, not received in Gmail.
   console.info('[Notification] Contact attempt:',{ownerProviderAccepted:ownerAccepted,clientProviderAccepted:clientAccepted});
   res.status(201).json({ok:true,reference:String(lead._id)});
 });
 // Public informational FAQ; never persists or forwards guest messages.
 api.post('/assistant/faq',async(req,res)=>{
  const {question}=z.object({question:clean.min(1).max(600)}).parse(req.body);
  const answer=publicFaqReply(question);
  res.json({answer:answer.text,matched:answer.matched,sentToOwner:false,persisted:false});
 });
 api.use(requireAuth);
 api.get('/me', (req,res)=>res.json({user:req.identity}));
 api.post('/conversations/start',async(req,res)=>{
   const user=req.identity!;
   const conversation=await Conversation.findOneAndUpdate({participantUid:user.uid},{$set:{participantEmail:user.email,participantName:user.name},$setOnInsert:{status:'open'}},{upsert:true,new:true,runValidators:true});
   res.json({conversation});
 });
 api.get('/conversations/:id/messages',async(req,res)=>{
   const conversation=await Conversation.findById(objectId(req.params.id));
   if(!conversation) throw asError('Conversation not found',404);
   if(conversation.participantUid!==req.identity!.uid && !req.identity!.admin)throw asError('Forbidden',403);
   const messages=await Message.find({conversationId:conversation._id}).sort({createdAt:1}).limit(200).lean();
   res.json({conversation,messages});
 });
 api.post('/conversations/:id/messages',async(req,res)=>{
   const {text}=messageSchema.parse(req.body);
   const conversation=await Conversation.findById(objectId(req.params.id));
   if(!conversation)throw asError('Conversation not found',404);
   if(conversation.participantUid!==req.identity!.uid)throw asError('Forbidden',403);
   if(conversation.status==='closed')throw asError('Conversation is closed',409);
   const history=await Message.find({conversationId:conversation._id}).sort({createdAt:-1}).limit(6).lean();
   const clientMessage=await Message.create({conversationId:conversation._id,sender:'client',text,deliveredBy:'person'});
   await Conversation.updateOne({_id:conversation._id},{$set:{lastMessageAt:new Date()}});
   io.to(`conversation:${conversation._id}`).to('owners').emit('conversation:update',{id:String(conversation._id)});
   // Do not email the private message body. The owner reads it after
   // authenticating in the dashboard. Await provider acceptance before returning.
   const ownerNotification=env.OWNER_NOTIFICATION_EMAIL
     ? sendEmail(env.OWNER_NOTIFICATION_EMAIL,'New live-chat message from portfolio',
         `A client sent a private message. Open the owner dashboard to read and reply:\nhttps://mdsakibmollah.vercel.app/dashboard\n\nConversation reference: ${conversation._id}`)
     : Promise.resolve(false);
   const reply=await assistantReply(text,history.reverse().map(m=>({sender:m.sender,text:m.text})));
   const botMessage=await Message.create({conversationId:conversation._id,sender:'assistant',text:reply.text,deliveredBy:reply.deliveredBy});
   io.to(`conversation:${conversation._id}`).to('owners').emit('conversation:update',{id:String(conversation._id)});
   const ownerAccepted=await ownerNotification;
   console.info('[Notification] Private chat attempt:',{ownerProviderAccepted:ownerAccepted});
   res.status(201).json({messages:[clientMessage,botMessage]});
 });
 // Authenticated feedback is private: only a conversation participant can submit it.
 api.post('/conversations/:id/feedback',async(req,res)=>{
   const {rating,comment}=feedbackSchema.parse(req.body);
   const conversation=await Conversation.findById(objectId(req.params.id));
   if(!conversation)throw asError('Conversation not found',404);
   if(conversation.participantUid!==req.identity!.uid)throw asError('Forbidden',403);
   const feedback=await Feedback.findOneAndUpdate({conversationId:conversation._id},
     {$set:{participantUid:req.identity!.uid,rating,comment}},
     {upsert:true,new:true,runValidators:true,setDefaultsOnInsert:true});
   res.json({ok:true,feedback});
 });
 const admin=Router();admin.use(requireAdmin);
 admin.get('/overview',async(_req,res)=>{
  const [totalLeads,newLeads,activeChats]=await Promise.all([Lead.countDocuments(),Lead.countDocuments({status:'new'}),Conversation.countDocuments({status:'open'})]);
  const feedbackCount=await Feedback.countDocuments();
  res.json({totalLeads,newLeads,activeChats,feedbackCount,emailAlertsConfigured:Boolean(env.RESEND_API_KEY&&env.RESEND_FROM_EMAIL&&env.OWNER_NOTIFICATION_EMAIL)});
 });
 // An explicit, owner-only email diagnostic. Never accepts an arbitrary destination
 // or exposes API keys. A provider 202 means ACCEPTED, not inbox delivery.
 const notificationTestLimit=rateLimit({windowMs:60*60*1000,limit:2,standardHeaders:'draft-8',legacyHeaders:false});
 admin.post('/notifications/test',notificationTestLimit,async(_req,res)=>{
  if(!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL || !env.OWNER_NOTIFICATION_EMAIL){
   res.status(503).json({error:'Email notifications are not configured. Set a verified Resend sender and API key on Render.',code:'EMAIL_NOT_CONFIGURED'});
   return;
  }
  const accepted=await sendEmail(env.OWNER_NOTIFICATION_EMAIL,'TEST - Portfolio email notifications',
   'This is an administrator-requested test from your MD Sakib Mollah portfolio. Check this Gmail inbox to confirm delivery. This is NOT a customer inquiry.');
  if(!accepted){
   res.status(502).json({error:'The email provider did not accept the test email. Check the verified sender, Resend settings and Render logs.',code:'EMAIL_PROVIDER_FAILED'});
   return;
  }
  res.status(202).json({ok:true,providerAccepted:true,inboxDeliveryVerified:false,message:'Email provider accepted the test. Confirm receipt in Gmail.'});
 });
 admin.get('/leads',async(_req,res)=>res.json({leads:await Lead.find().sort({createdAt:-1}).limit(150).lean()}));
 admin.get('/feedback',async(_req,res)=>res.json({feedback:await Feedback.find().sort({createdAt:-1}).limit(150).lean()}));
 admin.patch('/leads/:id',async(req,res)=>{const {status}=z.object({status:z.enum(['new','contacted','closed'])}).parse(req.body);const lead=await Lead.findByIdAndUpdate(objectId(req.params.id),{status},{new:true,runValidators:true});if(!lead)throw asError('Lead not found',404);res.json({lead});});
 admin.get('/conversations',async(_req,res)=>res.json({conversations:await Conversation.find().sort({lastMessageAt:-1}).limit(100).lean()}));
 admin.post('/conversations/:id/reply',async(req,res)=>{
   const {text}=messageSchema.parse(req.body);const conversation=await Conversation.findById(objectId(req.params.id));if(!conversation)throw asError('Not found',404);
   const message=await Message.create({conversationId:conversation._id,sender:'owner',text,deliveredBy:'person'});
   await Conversation.updateOne({_id:conversation._id},{$set:{lastMessageAt:new Date()}});
   io.to(`conversation:${conversation._id}`).emit('conversation:update',{id:String(conversation._id)});
   const clientAccepted=await sendEmail(conversation.participantEmail,'Sakib replied to your message',
     `Hello ${conversation.participantName},\n\nSakib has replied to your private conversation. Sign in to the portfolio chat to read it:\nhttps://mdsakibmollah.vercel.app\n\nConversation reference: ${conversation._id}`);
   console.info('[Notification] Owner reply attempt:',{clientProviderAccepted:clientAccepted});
   res.status(201).json({message});
 });
 api.use('/admin',admin);
 return api;
}
