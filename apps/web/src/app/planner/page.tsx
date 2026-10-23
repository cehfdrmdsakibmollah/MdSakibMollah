import type {Metadata} from 'next';
import ProjectPlanner from '@/components/project-planner';

export const metadata:Metadata={
 title:'Project Brief Builder | Plan Your Website, App or Automation',
 description:'Use a guided four-step project planner to organize your goals, features, timeline and budget before sending an inquiry to MD Sakib Mollah.',
 alternates:{canonical:'/planner'},
 twitter:{card:'summary_large_image',images:['/og-image.jpg']},
 openGraph:{images:[{url:'/og-image.jpg',width:1200,height:630,alt:'MD Sakib Mollah developer portfolio'}],title:'Project Brief Builder | MD Sakib Mollah',description:'Plan your app or website and prepare a clear, editable brief for a project discussion.',url:'/planner'},
};
export default function PlannerPage(){return <ProjectPlanner/>}
