/**
 * Curated, factual answers from MD Sakib Mollah's public portfolio.
 * No access to private messages; never invent a price, timeline, credential or client.
 * Visitors can use this FAQ without signing in, but it does not deliver messages.
 */
export function portfolioFaq(question:string):string|null {
 const q=question.toLocaleLowerCase().trim();
 if(!q) return null;
 const has=(p:RegExp)=>p.test(q);
 if(has(/\b(hi|hello|hey|assalamu|salam|good morning|good evening)\b|হ্যালো|হাই|সালাম|আসসালাম/))
  return "Hello! I'm MD Sakib Mollah's portfolio assistant. Ask about his services, tech stack, public projects, project pricing process or contact information. To message Sakib personally, please sign in.";
 if(has(/\b(your name|who are you|who is sakib|yourself|introduce|about sakib|your identity|what is your name)\b|তোমার নাম|আপনার নাম|কে তুমি|তুমি কে|সাকিব কে/))
  return "This is MD Sakib Mollah's portfolio assistant, not Sakib himself. Sakib is a web, mobile and AI-focused developer working with React, Next.js, Node.js, MongoDB, Firebase and React Native.";
 if(has(/\b(email|gmail|contact|phone|call|whatsapp|github|linkedin|reach|hire|connect)\b|ইমেইল|যোগাযোগ|ফোন|হোয়াটসঅ্যাপ|যোগাযোগ করব/))
  return "You can reach Sakib at ceh.fdr.mdsakibmollah@gmail.com or WhatsApp +8801407154481. His work is at github.com/cehfdrmdsakibmollah. For a project brief, use the Contact page, or sign in to send a private message.";
 if(has(/\b(price|pricing|cost|budget|quote|rate|fee|charge|paid|how much|payment|invoice|bkash|nagad)\b|দাম|খরচ|টাকা|প্রাইস|বিকাশ|নগদ|বাজেট/))
  return "Sakib has not published fixed project prices. Costs depend on the features, complexity and timeline. Share your project type, features, deadline and approximate budget for a tailored quote. Agree on an invoice and verified payment details privately; never share PINs or OTPs.";
 if(has(/\b(portfolio|past work|projects?|examples?|experience|previous work|work samples?)\b|প্রজেক্ট|কাজ দেখাও|পোর্টফোলিও/))
  return "Explore the Work page for linked public GitHub projects: React e-commerce, a Firebase-powered to-do app, a restaurant landing page, a weather dashboard, Google authentication and UI experiments. Individual project descriptions distinguish demos from deployed client work.";
 if(has(/\b(web|website|frontend|backend|next\.?js|react|express|node\.?js|mongodb|database|full.?stack|e.?commerce|seo)\b|ওয়েব|ওয়েবসাইট|সাইট|ইকমার্স/))
  return "Sakib works on responsive web applications and full-stack experiences using React, Next.js, Node.js/Express, REST APIs, MongoDB and Firebase. Share what your website needs—pages, user roles, payments, dashboards or integrations—for a scoped discussion.";
 if(has(/\b(mobile|android|ios|iphone|react native|expo|mobile app|app development)\b|মোবাইল|অ্যাপ/))
  return "Cross-platform Android and iOS mobile app development using React Native/Expo can be discussed. Tell Sakib the target devices, required features and deadline; he can review scope and feasibility.";
 if(has(/\b(ai|chatbot|assistant|llm|automation|agent|chatgpt|openai|rag)\b|এআই|চ্যাটবট|অটোমেশন/))
  return "Sakib offers discussion of AI assistants, API integrations, workflow automation and knowledge search. This portfolio assistant answers common questions; private messages require sign-in. Tell him what you want to automate and what sources/tools are involved.";
 if(has(/\b(time|timeline|deadline|when|availability|available|start project|delivery|how long)\b|কতদিন|সময়সীমা|সময় লাগবে|কবে/))
  return "Exact availability and delivery dates are not published and depend on project scope. Send a short brief, preferred start date and deadline; Sakib can confirm a realistic schedule personally.";
 if(has(/\b(education|qualification|certificate|creative it|training|course|study|skill)\b|সার্টিফিকেট|শিক্ষা|যোগ্যতা/))
  return "The portfolio references a Frontend Development With React certificate from Creative IT Institute (grade A+). See the Contact page for the redacted certificate link and the Work page for examples.";
 if(has(/\b(where|location|based|country|office|address)\b|কোথায়|ঠিকানা|অবস্থান/))
  return "Sakib can discuss work remotely. For an in-person meeting or a current office address, please contact him directly; this assistant cannot verify an address or live availability.";
 if(has(/\b(security|privacy|data|personal|message|sign.?in|log.?in|register|dashboard|reply|human)\b|নিরাপত্তা|প্রাইভেট|লগইন|মেসেজ/))
  return "Personal chat requires a verified Firebase sign-in. The private Dashboard and owner inbox are access-controlled. Messages are saved only when the backend confirms delivery; offline FAQ replies are not forwarded or stored as client messages. For privacy questions, see the Privacy page.";
 return null;
}
export function publicFaqReply(question:string):{text:string;matched:boolean}{
 const answer=portfolioFaq(question);
 return {text:answer??"I don't have a verified answer to that from Sakib's public portfolio. For a personal answer or project request, sign in to chat or use the Contact page. This FAQ response was not sent or saved as a message for Sakib.",matched:Boolean(answer)};
}
