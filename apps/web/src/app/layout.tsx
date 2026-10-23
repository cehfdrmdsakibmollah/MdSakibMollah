import type {Metadata} from 'next';
import {Inter,Space_Grotesk} from 'next/font/google';
import '@/app/globals.css';
import Providers from '@/components/providers';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ChatWidget from '@/components/chat-widget';
import AuthModal from '@/components/auth-modal';
import ConsentBanner from '@/components/consent-banner';
import CommandPalette from '@/components/command-palette';
import {site} from '@/lib/site';
import {personJsonLd,websiteJsonLd} from '@/lib/seo';
import {StructuredData} from '@/components/breadcrumbs';
const inter=Inter({subsets:['latin'],variable:'--font-inter',display:'swap'});const space=Space_Grotesk({subsets:['latin'],variable:'--font-space',display:'swap'});
export const metadata:Metadata={metadataBase:new URL(site.url),title:{default:'MD Sakib Mollah | React, Next.js & Full-Stack Developer',template:'%s | MD Sakib Mollah'},description:site.description,applicationName:site.name,icons:{icon:'/icon.svg'},keywords:['MD Sakib Mollah','Sakib Mollah developer','React developer','Next.js developer','full stack web developer','React Native developer','Firebase developer','AI integration developer'],authors:[{name:site.name,url:site.github}],creator:site.name,alternates:{canonical:'/'},openGraph:{type:'website',url:site.url,title:'MD Sakib Mollah | Developer Portfolio',description:site.description,siteName:site.name,images:[{url:'/og-image.jpg',width:1200,height:630,alt:'MD Sakib Mollah developer portfolio'}]},twitter:{card:'summary_large_image',title:site.name,description:site.description,images:['/og-image.jpg']},robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large'}},verification:{google:process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION||undefined}};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en" suppressHydrationWarning><body className={`${inter.variable} ${space.variable} font-sans antialiased`}><StructuredData value={personJsonLd()}/><StructuredData value={websiteJsonLd()}/><Providers><a className="skip-link" href="#main">Skip to main content</a><Header/><main id="main" tabIndex={-1}>{children}</main><Footer/><ChatWidget/><AuthModal/><ConsentBanner/><CommandPalette/></Providers></body></html>;
}
