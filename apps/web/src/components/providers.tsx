"use client";
import {createContext,useContext,useEffect,useState} from 'react';
import type {ReactNode} from 'react';
import {ThemeProvider} from 'next-themes';
import {onAuthStateChanged,type User} from 'firebase/auth';
import {auth} from '@/lib/firebase';
type AuthState={user:User|null;loading:boolean;isAuthOpen:boolean;setAuthOpen:(value:boolean)=>void};
const AuthContext=createContext<AuthState|null>(null);
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('useAuth requires Providers');return value;}
export default function Providers({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null);const [loading,setLoading]=useState(true);const [isAuthOpen,setAuthOpen]=useState(false);
 useEffect(()=>{const stop=onAuthStateChanged(auth,u=>{setUser(u);setLoading(false);});return stop;},[]);
 return <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange><AuthContext.Provider value={{user,loading,isAuthOpen,setAuthOpen}}>{children}</AuthContext.Provider></ThemeProvider>;
}
