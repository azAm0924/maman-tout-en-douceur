export type CartItem = { entryId:string; title:string; slug:string; variant:'pdf'|'print'; quantity:number; priceCents:number };
const KEY='mted-shop-cart-v1';
export function readCart():CartItem[] {if(typeof window==='undefined')return [];try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value.filter(i=>i && typeof i.entryId==='string' && ['pdf','print'].includes(i.variant) && Number.isInteger(i.quantity)&&i.quantity>=1&&i.quantity<=10).slice(0,20):[];}catch{return [];}}
export function storeCart(items:CartItem[]){localStorage.setItem(KEY,JSON.stringify(items));window.dispatchEvent(new Event('mted-cart-update'));}
export function addCart(item:CartItem){const cart=readCart();const target=cart.find(i=>i.entryId===item.entryId&&i.variant===item.variant);if(target)target.quantity=item.variant==='pdf'?1:Math.min(10,target.quantity+item.quantity);else if(cart.length<20)cart.push(item);storeCart(cart);}
