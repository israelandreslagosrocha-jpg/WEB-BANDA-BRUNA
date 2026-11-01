# Push de la intranet

Implementación estándar Web Push con web-push (código abierto), sin servicios de WhatsApp ni servidor adicional permanente. Usa las funciones de la web en Vercel y Supabase existentes. Su uso queda sujeto a los límites vigentes de esos planes. No se garantiza entrega inmediata: permisos, conectividad y concentración del dispositivo influyen.

## Activación en producción pendiente

1. Aplicar `scripts/intranet_push_setup.sql` después de `scripts/intranet_setup.sql` en el SQL Editor de Supabase. Desactiva el trigger anterior de WhatsApp si existe. No requiere importar teléfonos.
2. `node scripts/generate_push_secrets.mjs` crea una sola vez `.env.push.local`, privado e ignorado por Git. Ya generado localmente. Guardar SUS MISMAS tres variables en Vercel: `PUSH_VAPID_PUBLIC_KEY`, `PUSH_VAPID_PRIVATE_KEY`, `PUSH_WORKER_SECRET`. Configurar también `SUPABASE_SECRET_KEY` o `SUPABASE_SERVICE_ROLE_KEY` de servidor. No pegar claves privadas en chat ni usar prefijo PUBLIC. Conservar VAPID para que las suscripciones no caduquen al redeplegar.
3. Desplegar la web. HTTPS es obligatorio fuera de localhost.
4. En Supabase Vault crear `intranet_push_delivery_url` con `https://www.bandabruna.cl/api/intranet/push-delivery` (usar el dominio definitivo sin redirecciones) y `intranet_push_worker_secret` con exactamente `PUSH_WORKER_SECRET`. No guardarlos en SQL versionado.
5. Aplicar `scripts/intranet_push_delivery_setup.sql`. Activa pg_net y despierta al despachador tras nuevas filas en la cola. Las llamadas se despachan después del commit, y un fallo de red no cancela la publicación.
6. Configurar un trabajo en Supabase Cron cada minuto (`* * * * *`) para recuperar filas pendientes, con este SQL que lee Vault sin claves en claro:

```sql
select net.http_post(
 url := (select decrypted_secret from vault.decrypted_secrets where name='intranet_push_delivery_url'),
 headers := jsonb_build_object('Content-Type','application/json','x-push-secret',
   (select decrypted_secret from vault.decrypted_secrets where name='intranet_push_worker_secret')),
 body := '{}'::jsonb, timeout_milliseconds := 15000
);
```

7. Entrar con una cuenta real y activar en cada dispositivo. Probar primero un aviso personal autorizado y después uno general. Revisar cola y recepción con el dispositivo bloqueado. La demo no pide permiso ni guarda suscripciones.

No se aplicaron migraciones, secretos remotos ni despliegue desde este entorno: falta acceso administrativo. Ninguna notificación real ha sido enviada.

## Integrantes

Android/escritorio: abrir el panel y pulsar Activar notificaciones. iPhone/iPad: iOS/iPadOS 16.4+, abrir en Safari → Compartir → Agregar a Inicio; abrir desde el icono, entrar y activar. Puede desactivarse por dispositivo desde el panel. Cerrar sesión elimina la suscripción de ese dispositivo antes de salir; no afecta otros equipos.

Vicente, Jaime y César generan avisos a los destinatarios de sus publicaciones. El autor no recibe su propio aviso. Un aviso privado nunca se expande a toda la banda. Cada dispositivo suscrito recibe su copia. El aviso de pantalla bloqueada es genérico: no expone pagos, títulos privados, archivos, ubicación o instrucciones. Al abrirlo se exige la sesión normal y RLS controla el contenido. El service worker no guarda páginas ni material privado en caché.

## Cola y estados

Trigger de publicación y cola en una misma transacción; unicidad por publicación/dispositivo; reclamación SKIP LOCKED evita envíos simultáneos duplicados. Procesa 10 filas por invocación. `accepted` indica aceptación por el servicio push, no lectura ni entrega al teléfono. El estado sin leer de la intranet es independiente.

404/410 elimina suscripciones vencidas. `unknown` o `sending` antiguo requiere inspección antes de reintentar: pudo haberse aceptado el aviso y perderse la respuesta. Los fallidos no se reenvían automáticamente. Cron solo atiende `pending`. La biblioteca no sigue una URL arbitraria: la validación admite los servicios push de Chrome/FCM, Firefox y Apple por HTTPS; otros navegadores pueden requerir ampliar la lista tras verificar su proveedor.

Pruebas: `node scripts/test_intranet_push.mjs` comprueba validación contra SSRF, payload sin contenido privado y apertura segura de la intranet desde el service worker. Pendiente validar RLS/triggers y entrega en dispositivos reales tras activar producción.

Referencias: https://github.com/web-push-libs/web-push · https://webkit.org/blog/13878/ · https://supabase.com/docs/guides/database/webhooks

## Estado remoto comprobado · 1 de noviembre de 2026

- Vercel `lagosrocha/web-banda-bruna`: tres variables PUSH guardadas como Secret, solo Producción. `SUPABASE_SERVICE_ROLE_KEY` ya existía. Valores privados no expuestos.
- Supabase `yfwchuldoudgjpuxnjqi`: ya existen las siete tablas de intranet/eventos/push, los triggers `intranet_push_after_publish` e `intranet_push_wake`, pg_net y Vault. No se repitieron migraciones.
- Se agregaron en Vault `intranet_push_delivery_url` (www.bandabruna.cl/api/intranet/push-delivery) y `intranet_push_worker_secret`, coincidente con Vercel.
- pg_cron habilitado. Job 1 `intranet-push-delivery`, cada minuto, creado con `active=false`. Activarlo solo después de desplegar y verificar el endpoint. Lee Vault, sin claves en claro en el SQL de Cron.
- Producción sigue en commit `31b426e`, anterior a la intranet. Cambios locales pendientes de publicar. El propietario autorizó explícitamente commit y push el 1 de noviembre de 2026. Redeploy del commit viejo no publica esta implementación.
- Vercel muestra un aviso de pago fallido/facturas pendientes; no se realizaron acciones financieras.
- Sin notificaciones reales enviadas. Tras publicar: comprobar endpoint, activar Cron, suscribir un dispositivo real con permiso y probar recepción autorizada.
