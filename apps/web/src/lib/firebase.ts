import {getApp,getApps,initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
const config={
 apiKey:process.env.NEXT_PUBLIC_FIREBASE_API_KEY||'AIzaSyBb46QOhaNS5ZLPFaArD2yxc-oUggg9vmA',
 authDomain:process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN||'mdsakibmollahportfolio.firebaseapp.com',
 projectId:process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID||'mdsakibmollahportfolio',
 storageBucket:process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET||'mdsakibmollahportfolio.firebasestorage.app',
 messagingSenderId:process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID||'230140501094',
 appId:process.env.NEXT_PUBLIC_FIREBASE_APP_ID||'1:230140501094:web:2fd471c65cc2849286a1a7',
 measurementId:process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID||'G-NTJ1NGGNRL'
};
export const firebaseApp=getApps().length?getApp():initializeApp(config);
export const auth=getAuth(firebaseApp);
export async function enableAnalytics(){if(typeof window==='undefined')return;const {isSupported,getAnalytics}=await import('firebase/analytics');if(await isSupported())getAnalytics(firebaseApp);}
