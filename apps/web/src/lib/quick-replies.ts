/** Local FAQ answers are intentionally NOT delivered to the portfolio owner. */
export function quickReply(text: string): string {
  const q = text.toLocaleLowerCase('en-US').trim();
  if (/\b(hello|hi|hey|salam|assalamualaikum)\b|হ্যালো|হাই|আসসালাম/.test(q))
    return 'Hello! 👋 Welcome to MD Sakib Mollah’s portfolio. I can explain services, projects, contact options, and payment steps. To send Sakib a private message, sign in and connect the backend, or use WhatsApp.';
  if (/\b(bkash|nagad|pay|payment|invoice|wallet)\b|বিকাশ|নগদ|পেমেন্ট/.test(q))
    return 'bKash and Nagad personal transfers can be discussed once the project scope and invoice are agreed. Please confirm the correct receiving wallet privately with Sakib. Do not send any PIN, OTP, or payment in this chat.';
  if (/\b(whatsapp|email|contact|phone|call|github|linkedin)\b|যোগাযোগ/.test(q))
    return 'Contact Sakib on WhatsApp: +8801407154481, email: ceh.fdr.mdsakibmollah@gmail.com, GitHub: github.com/cehfdrmdsakibmollah or LinkedIn: linkedin.com/in/cehfdrmdsakibmollah. The Contact page has working clickable links.';
  if (/\b(price|pricing|cost|budget|rate|quote|charge)\b|টাকা|দাম/.test(q))
    return 'Project pricing depends on your requirements, features and timeline. Please share a short brief via WhatsApp or the Contact form to request a personalized estimate. This assistant cannot promise a fixed price.';
  if (/\b(react|next(?:\.js)?|website|frontend|backend|web(?:site| app)?|mongo(?:db)?|firebase)\b|ওয়েব/.test(q))
    return 'Sakib works with React, Next.js, Node/Express APIs, MongoDB, Firebase and responsive interfaces. Visit Work to see actual public GitHub projects.';
  if (/\b(mobile|android|ios|application|apps?|expo)\b|মোবাইল/.test(q))
    return 'React Native and Expo mobile projects can be discussed. Which platforms and features do you need?';
  if (/\b(ai|chatbots?|automations?|llm|agents?|rag)\b/.test(q))
    return 'AI assistants, LLM integrations and automation workflows are available for discussion. Describe the business problem you want to solve.';
  if (/\b(certificate|qualification|creative it|education|course)\b|কোর্স/.test(q))
    return 'Sakib completed Frontend Development With React at Creative IT Institute with grade A+. A privacy-redacted certificate is linked on the Contact page.';
  return 'I can help with services, project inquiries, pricing, contact options, or payment process. For a personal response, please use WhatsApp or the Contact form. This automated offline reply was not sent to Sakib.';
}
