import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  async headers() {
    return [{source:'/commande/merci',headers:[
      {key:'Referrer-Policy',value:'no-referrer'},
      {key:'Cache-Control',value:'private, no-store'},
      {key:'X-Robots-Tag',value:'noindex, nofollow'},
    ]}];
  },
};
export default nextConfig;
