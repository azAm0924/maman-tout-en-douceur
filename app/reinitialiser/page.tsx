'use client';
import {useState} from 'react';import Link from 'next/link';import {getBrowserClient} from '@/lib/data';
export default function ResetPage(){const [password,setPassword]=useState('');const [msg,setMsg]=useState('');
 async function change(e:React.FormEvent){e.preventDefault();const db=getBrowserClient();if(!db)return;const {error}=await db.auth.updateUser({password});setMsg(error?.message||'Mot de passe modifié.');}
 return <main className="auth-shell"><section className="auth-card"><h1>Nouveau mot de passe</h1><form onSubmit={change}><div className="form-field"><label>Mot de passe (8 caractères minimum)</label><input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></div><button className="btn btn-primary">Enregistrer</button></form><p role="status">{msg}</p><Link href="/connexion">Connexion</Link></section></main>}
