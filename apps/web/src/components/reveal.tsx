"use client";
import {motion,useReducedMotion} from 'framer-motion';import type {ReactNode} from 'react';
export default function Reveal({children,className='',delay=0}:{children:ReactNode;className?:string;delay?:number}){const reduced=useReducedMotion();return <motion.div initial={reduced?false:{opacity:0,y:34}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.12}} transition={{duration:.65,delay,ease:[.2,.8,.2,1]}} className={className}>{children}</motion.div>}
