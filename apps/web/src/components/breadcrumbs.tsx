import Link from 'next/link';
import {ChevronRight} from 'lucide-react';
import {breadcrumbJsonLd,safeJsonLd,type BreadcrumbItem} from '@/lib/seo';

export function StructuredData({value}:{value:unknown}){
 return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(value)}}/>;
}
export default function Breadcrumbs({items}:{items:readonly BreadcrumbItem[]}){
 const data=breadcrumbJsonLd(items);
 return <>
  <StructuredData value={data}/>
  <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm muted">
   <ol className="flex flex-wrap items-center gap-2">
    {items.map((item,index)=><li key={item.path} className="inline-flex items-center gap-2">
      {index!==0&&<ChevronRight size={14} aria-hidden="true"/>}
      {index===items.length-1?<span aria-current="page" className="text-blue-500 font-medium">{item.name}</span>
       :<Link href={item.path} className="hover:text-blue-500 underline-offset-4 hover:underline">{item.name}</Link>}
    </li>)}
   </ol>
  </nav>
 </>;
}
