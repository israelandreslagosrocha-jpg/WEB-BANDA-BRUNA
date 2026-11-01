import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import webpush from 'web-push';
const path='.env.push.local';
const keys=webpush.generateVAPIDKeys();
try{await fs.writeFile(path,`PUSH_VAPID_PUBLIC_KEY=${keys.publicKey}\nPUSH_VAPID_PRIVATE_KEY=${keys.privateKey}\nPUSH_WORKER_SECRET=${crypto.randomBytes(32).toString('hex')}\n`,{flag:'wx',mode:0o600});console.log('Claves guardadas en .env.push.local (privado, ignorado por Git). No compartir ni regenerar al desplegar.');}catch(e){if(e.code==='EEXIST')console.log('Ya existen claves; se conservaron sin cambios.');else throw e;}
