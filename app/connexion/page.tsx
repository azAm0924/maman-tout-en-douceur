'use client';
import {useEffect,useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {getBrowserClient} from '@/lib/data';
export default function AccountAuth(){
 const router=useRouter(); const [mode,setMode]=useState<'login'|'register'|'reset'>('login');
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
 useEffect(()=>{const db=getBrowserClient(); if(!db)return;void db.auth.getUser().then(async ({data:{user}})=>{if(!user)return;const {data}=await db.rpc('is_admin');router.replace(data?'/admin':'/compte');});},[router]);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');setMessage('');const db=getBrowserClient();if(!db){setError('Configuration Supabase manquante');setBusy(false);return;}
 try{
  if(mode==='register'){
   const {error:e}=await db.auth.signUp({email,password,options:{emailRedirectTo:`${window.location.origin}/compte`}});
   if(e)throw e; setMessage('Compte demandé. Vérifiez votre boîte e-mail pour confirmer votre inscription, puis connectez-vous.');setMode('login');setPassword('');
  }else if(mode==='reset'){
   const {error:e}=await db.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reinitialiser`});if(e)throw e;
   setMessage('Si cette adresse possède un compte, un e-mail de réinitialisation a été envoyé.');
  }else{
   const {error:e}=await db.auth.signInWithPassword({email,password});if(e)throw e;
   const {data:admin}=await db.rpc('is_admin');router.replace(admin?'/admin':'/compte');router.refresh();
  }
 }catch(e){setError(e instanceof Error?e.message:'Impossible de terminer cette opération.');}finally{setBusy(false);}}
 return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">MAMAN TOUT EN DOUCEUR</p><h1>{mode==='login'?'Bienvenue !':mode==='register'?'Créer mon compte':'Mot de passe oublié'}</h1><p>{mode==='register'?'Retrouvez vos commandes, vos favoris et vos achats PDF.':mode==='reset'?'Nous vous enverrons un lien sécurisé.':'Connectez-vous à votre espace personnel.'}</p>
 <form onSubmit={submit}><div className="form-field"><label htmlFor="email">E-mail</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div>
 {mode!=='reset'&&<div className="form-field"><label htmlFor="password">Mot de passe</label><input id="password" type="password" autoComplete={mode==='register'?'new-password':'current-password'} minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></div>}
 {error&&<p role="alert" className="error-box">{error}</p>}{message&&<p role="status" className="success-box">{message}</p>}
 <button type="submit" className="btn btn-primary" disabled={busy}>{busy?'Traitement…':mode==='register'?'Créer mon compte':mode==='reset'?'Envoyer le lien':'Se connecter'}</button></form>
 <div className="account-auth-links"><button type="button" onClick={()=>{setMode(mode==='register'?'login':'register');setError('');}}>{mode==='register'?'Déjà un compte ? Connexion':'Créer un compte client'}</button><button type="button" onClick={()=>{setMode(mode==='reset'?'login':'reset');setError('');}}>{mode==='reset'?'Retour à la connexion':'Mot de passe oublié ?'}</button></div><p><Link href="/">← Retour au site</Link></p></section></main>;
}
