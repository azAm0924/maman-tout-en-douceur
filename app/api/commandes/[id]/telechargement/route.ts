import { NextResponse } from 'next/server';
import { commerceDb, tokenMatches } from '@/lib/commerce-server';
export const runtime = 'nodejs';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const u=new URL(request.url);
  const token=u.searchParams.get('cle') ?? '';
  const lineId=u.searchParams.get('ligne') ?? '';
  if(!/^[a-f0-9-]{36}$/i.test(id)|| !/^[a-f0-9-]{36}$/i.test(lineId)) return new NextResponse('Requête incorrecte',{status:400});
  const db=commerceDb();
  const {data:order}=await db.from('orders').select('access_token_hash,status,digital_consent').eq('id',id).maybeSingle();
  if(!order || !tokenMatches(token,order.access_token_hash) || order.status!=='paid' || !order.digital_consent) return new NextResponse('Téléchargement indisponible',{status:403,headers:{'Cache-Control':'no-store'}});
  const {data:item}=await db.from('order_items').select('paid_pdf_path').eq('id',lineId).eq('order_id',id).eq('variant','pdf').maybeSingle();
  if(!item?.paid_pdf_path)return new NextResponse('Document introuvable',{status:404});
  const {data,error}=await db.storage.from('paid-downloads').createSignedUrl(item.paid_pdf_path,60,{download:true});
  if(error || !data?.signedUrl) return new NextResponse('Fichier indisponible',{status:503});
  return NextResponse.redirect(data.signedUrl,{status:303,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
}
