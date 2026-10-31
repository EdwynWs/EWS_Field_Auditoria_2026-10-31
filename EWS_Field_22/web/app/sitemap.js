export default function sitemap(){const base=process.env.SITE_URL;if(!base)return [];return ['/','/privacidade'].map(route=>({url:new URL(route,base).href}));}
