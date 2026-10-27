'use client';
import {useEffect} from 'react';
import {storeCart} from '@/lib/cart';
export function ClearCartOnPaid({orderId}:{orderId:string}){useEffect(()=>{try{if(sessionStorage.getItem('mted-last-checkout-id')===orderId){storeCart([]);sessionStorage.removeItem('mted-last-checkout-id');}}catch{}},[orderId]);return null;}
