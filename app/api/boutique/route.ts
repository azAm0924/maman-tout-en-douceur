import {NextResponse} from 'next/server';import {getShippingCents} from '@/lib/commerce-server';
export const runtime='nodejs';
export async function GET(){return NextResponse.json({shippingCents:getShippingCents()},{headers:{'Cache-Control':'public, max-age=300'}});}
