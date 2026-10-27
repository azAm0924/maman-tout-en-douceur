import {NextResponse} from 'next/server';
import {stripeServer} from '@/lib/commerce-server';
import {requestUser,stripeCustomerFor,validOrigin} from '@/lib/customer-server';
export const runtime='nodejs';
export async function GET(req:Request){
 const user=await requestUser(req); if(!user)return NextResponse.json({error:'Connexion requise'},{status:401});
 const customer=await stripeCustomerFor(user);
 const result=await stripeServer().paymentMethods.list({customer,type:'card',limit:100});
 return NextResponse.json({cards:result.data.filter(c=>c.card).map(c=>({id:c.id,brand:c.card?.brand,last4:c.card?.last4,exp_month:c.card?.exp_month,exp_year:c.card?.exp_year}))},{headers:{'Cache-Control':'private, no-store'}});
}
export async function POST(req:Request){
 if(!validOrigin(req))return NextResponse.json({error:'Origine invalide'},{status:403});
 const user=await requestUser(req); if(!user)return NextResponse.json({error:'Connexion requise'},{status:401});
 const customer=await stripeCustomerFor(user);
 const origin=new URL(process.env.NEXT_PUBLIC_SITE_URL!).origin;
 const session=await stripeServer().checkout.sessions.create({mode:'setup',locale:'fr',customer,success_url:`${origin}/compte?carte=ajoutee`,cancel_url:`${origin}/compte?carte=annulee`,
  metadata:{user_id:user.id}});
 return NextResponse.json({url:session.url});
}
export async function DELETE(req:Request){
 if(!validOrigin(req))return NextResponse.json({error:'Origine invalide'},{status:403});
 const user=await requestUser(req); if(!user)return NextResponse.json({error:'Connexion requise'},{status:401});
 const {id}=await req.json().catch(()=>({}));
 if(typeof id!=='string'||!/^pm_[a-zA-Z0-9]+$/.test(id))return NextResponse.json({error:'Carte invalide'},{status:400});
 const customer=await stripeCustomerFor(user);
 const stripe=stripeServer(); const method=await stripe.paymentMethods.retrieve(id);
 if(method.customer!==customer)return NextResponse.json({error:'Accès refusé'},{status:403});
 await stripe.paymentMethods.detach(id);
 return NextResponse.json({ok:true});
}
