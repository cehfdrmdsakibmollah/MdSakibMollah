import {Router} from 'express';
import {z} from 'zod';
import mongoose from 'mongoose';
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
   if(env.OWNER_NOTIFICATION_EMAIL) void sendEmail(env.OWNER_NOTIFICATION_EMAIL,`New portfolio inquiry: ${safe.name}`,`${safe.name} (${safe.email})\nCompany: ${safe.company}\nService: ${safe.service}\nBudget: ${safe.budget}\n\n${safe.message}`);
   void sendEmail(safe.email,'We received your project inquiry',`Hi ${safe.name},\nThanks for contacting MD Sakib Mollah. Your inquiry has been received. Sakib will review it and respond personally; this is an automated confirmation.`);
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
   if(env.OWNER_NOTIFICATION_EMAIL)void sendEmail(env.OWNER_NOTIFICATION_EMAIL,'New live-chat message from portfolio',`${conversation.participantName} (${conversation.participantEmail}):\n\n${text}`);
   const reply=await assistantReply(text,history.reverse().map(m=>({sender:m.sender,text:m.text})));
   const botMessage=await Message.create({conversationId:conversation._id,sender:'assistant',text:reply.text,deliveredBy:reply.deliveredBy});
   io.to(`conversation:${conversation._id}`).to('owners').emit('conversation:update',{id:String(conversation._id)});
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
 admin.get('/leads',async(_req,res)=>res.json({leads:await Lead.find().sort({createdAt:-1}).limit(150).lean()}));
 admin.get('/feedback',async(_req,res)=>res.json({feedback:await Feedback.find().sort({createdAt:-1}).limit(150).lean()}));
 admin.patch('/leads/:id',async(req,res)=>{const {status}=z.object({status:z.enum(['new','contacted','closed'])}).parse(req.body);const lead=await Lead.findByIdAndUpdate(objectId(req.params.id),{status},{new:true,runValidators:true});if(!lead)throw asError('Lead not found',404);res.json({lead});});
 admin.get('/conversations',async(_req,res)=>res.json({conversations:await Conversation.find().sort({lastMessageAt:-1}).limit(100).lean()}));
 admin.post('/conversations/:id/reply',async(req,res)=>{
   const {text}=messageSchema.parse(req.body);const conversation=await Conversation.findById(objectId(req.params.id));if(!conversation)throw asError('Not found',404);
   const message=await Message.create({conversationId:conversation._id,sender:'owner',text,deliveredBy:'person'});
   await Conversation.updateOne({_id:conversation._id},{$set:{lastMessageAt:new Date()}});
   io.to(`conversation:${conversation._id}`).emit('conversation:update',{id:String(conversation._id)});
   void sendEmail(conversation.participantEmail,'Sakib replied to your message',`Hello ${conversation.participantName},\n\n${text}\n\nYou can also read the message in your portfolio chat.`);
   res.status(201).json({message});
 });
 api.use('/admin',admin);
 return api;
}
