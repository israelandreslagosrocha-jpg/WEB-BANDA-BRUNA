// Sin caché de páginas ni archivos privados.
self.addEventListener('push',event=>{
 let data={};try{data=event.data?.json()||{};}catch{}
 event.waitUntil(self.registration.showNotification('Banda Bruna · Novedades',{body:'Tienes un nuevo aviso en tu intranet. Ingresa para revisarlo.',icon:'/assets/images/logos/push-192.png',badge:'/assets/images/logos/push-192.png',tag:typeof data.tag==='string'?data.tag:'intranet',data:{url:'/admin/personal'}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil((async()=>{const url=new URL('/admin/personal',self.location.origin).href;const tabs=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const tab of tabs){if(tab.url.startsWith(url)){await tab.focus();return;}}await self.clients.openWindow(url);})());
});
