import type {Metadata} from 'next';
import {Inter,Space_Grotesk} from 'next/font/google';
import '@/app/globals.css';
import Providers from '@/components/providers';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ChatWidget from '@/components/chat-widget';
import AuthModal from '@/components/auth-modal';
import ConsentBanner from '@/components/consent-banner';
import {site} from '@/lib/site';
const inter=Inter({subsets:['latin'],variable:'--font-inter',display:'swap'});const space=Space_Grotesk({subsets:['latin'],variable:'--font-space',display:'swap'});
export const metadata:Metadata={metadataBase:new URL(site.url),title:{default:'MD Sakib Mollah | Full-Stack Web, Mobile & AI Developer',template:'%s | MD Sakib Mollah'},description:site.description,applicationName:site.name,icons:{icon:'/icon.svg'},keywords:['MD Sakib Mollah','Sakib Mollah developer','React developer','Next.js developer','full stack web developer','React Native developer','Firebase developer','AI integration developer'],authors:[{name:site.name,url:site.github}],creator:site.name,alternates:{canonical:'/'},openGraph:{type:'website',url:site.url,title:'MD Sakib Mollah | Developer Portfolio',description:site.description,siteName:site.name,images:[{url:'/og-image.jpg',width:1200,height:630,alt:'MD Sakib Mollah developer portfolio'}]},twitter:{card:'summary_large_image',title:site.name,description:site.description,images:['/og-image.jpg']},robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large'}},verification:{google:process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION||undefined}};
export default function RootLayout({children}:{children:React.ReactNode}){
 const jsonLd={ '@context':'https://schema.org','@type':'Person',name:site.name,url:site.url,jobTitle:site.role,image:`${site.url}/images/sakib-client-photo.webp`,sameAs:[site.github,site.linkedin],knowsAbout:['React','Next.js','Node.js','Firebase','React Native','MongoDB','AI APIs']};
 return <html lang="en" suppressHydrationWarning><body className={`${inter.variable} ${space.variable} font-sans antialiased`}><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,'\\u003c')}}/><Providers><Header/><main id="main">{children}</main><Footer/><ChatWidget/><AuthModal/><ConsentBanner/></Providers></body></html>;
}
