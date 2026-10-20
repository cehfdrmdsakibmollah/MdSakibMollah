
import mongoose from "mongoose";
import dns from "node:dns";

const { Schema, model, models } = mongoose;


const timestamps={timestamps:true,versionKey:false} as const;
const leadSchema=new Schema({
  name:{type:String,required:true,trim:true,maxlength:90},email:{type:String,required:true,lowercase:true,trim:true,maxlength:254},
  company:{type:String,trim:true,maxlength:100,default:''},service:{type:String,trim:true,maxlength:100,default:''},
  budget:{type:String,trim:true,maxlength:80,default:''},message:{type:String,required:true,maxlength:4000},
  status:{type:String,enum:['new','contacted','closed'],default:'new',index:true},
  source:{type:String,default:'website'}
},timestamps);
leadSchema.index({createdAt:-1}); leadSchema.index({email:1,createdAt:-1});
export const Lead = models.Lead || model('Lead',leadSchema);
const conversationSchema=new Schema({
  participantUid:{type:String,required:true,unique:true,index:true},
  participantEmail:{type:String,required:true,lowercase:true,index:true},
  participantName:{type:String,default:'Client'},
  status:{type:String,enum:['open','closed'],default:'open',index:true},
  lastMessageAt:{type:Date,default:Date.now,index:true}
},timestamps);
export const Conversation = models.Conversation || model('Conversation',conversationSchema);
const messageSchema=new Schema({
  conversationId:{type:Schema.Types.ObjectId,ref:'Conversation',required:true,index:true},
  sender:{type:String,enum:['client','assistant','owner'],required:true},
  text:{type:String,required:true,maxlength:5000},
  deliveredBy:{type:String,enum:['person','rule','ai'],default:'person'}
},timestamps);
messageSchema.index({conversationId:1,createdAt:1});
export const Message = models.Message || model('Message',messageSchema);

export async function connectDb() {
  if (process.env.NODE_ENV === "development") {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }

  await mongoose.connect(process.env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 12000,
    maxPoolSize: 10,
  });

  console.log("MongoDB Atlas connected successfully");
}


/** Private satisfaction feedback is collected only from the verified conversation owner.
 * Ratings are never surfaced publicly as testimonials without separate consent.
 */
const feedbackSchema = new Schema({
 conversationId:{type:Schema.Types.ObjectId,ref:'Conversation',required:true,unique:true,index:true},
 participantUid:{type:String,required:true,index:true},
 rating:{type:Number,required:true,min:1,max:5},
 comment:{type:String,trim:true,maxlength:600,default:''}
}, timestamps);
feedbackSchema.index({createdAt:-1});
export const Feedback = models.Feedback || model('Feedback',feedbackSchema);
