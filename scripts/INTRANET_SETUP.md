# Intranet personal

Entrada: `/admin` → `/admin/personal` para los siete correos registrados.
La administración conserva `/admin/dashboard` y puede abrir la intranet desde su menú.

## Activación

1. En el proyecto Supabase de esta web, ejecutar `scripts/intranet_setup.sql` completo en SQL Editor. Es una migración de una sola ejecución, dentro de una transacción.
2. Los siete usuarios deben existir en Authentication, con el correo confirmado y su contraseña configurada. Los correos se comparan en minúsculas.
3. Desplegar la web con sus variables públicas de Supabase actuales.

No se han cambiado contraseñas ni usuarios existentes. No se necesita una clave de servicio en el navegador.

## Permisos

- Jaime Cárdenas y César Bruna: todos los tipos de publicaciones, tenidas guardadas y avisos por evento.
- Vicente Núñez: ensayos, repertorios, canciones/mixes e indicaciones personales.
- Otros integrantes: lectura de lo dirigido a ellos y confirmación de lectura/checklist propio.
- Cuenta de administración: acceso a los avisos generales y publicación; las indicaciones privadas de otros autores conservan su restricción por destinatario.
- Los destinatarios vacíos significan toda la banda; las indicaciones personales exigen un único destinatario. El autor puede ver su propio envío.

Los avisos sin leer funcionan como notificaciones internas persistentes; se actualizan al abrir la intranet, con el botón Actualizar y cada 30 segundos mientras la página está visible. No se envían emails ni notificaciones push del sistema.

Los archivos se guardan en el bucket privado `intranet` (50 MB), y se abren mediante enlaces firmados de cinco minutos. Las políticas de lectura del archivo comprueban que el usuario pueda leer su publicación. PDF, DOCX, imágenes y audio están admitidos. Los audios compatibles se reproducen dentro de la intranet. Los planes musicales incluyen campos separados para trabajo interno y participantes, próximo ensayo, repertorio del show y canciones nuevas.

Los horarios se guardan en UTC y se introducen/muestran en America/Santiago.

## Verificación después de aplicar

- Entrar con cada uno de los siete usuarios y comprobar nombre y rol.
- Publicar un comunicado con Jaime: los otros integrantes deben recibirlo sin leer.
- Enviar con Vicente una indicación personal a Israel: solo Vicente e Israel pueden verla, incluido su archivo.
- Verificar con una sesión de integrante que un INSERT directo en intranet_entries sea rechazado y que no pueda modificar receipts de otro usuario.
- Guardar una tenida con César y asociarla a un evento con fecha y lugar.
- Completar un checklist con un integrante, recargar y comprobar que los demás mantengan su estado independiente.
- Subir y reproducir un MP3, abrir un PDF y comprobar que el bucket no sea público.

La migración no se ha aplicado desde el entorno local: no hay conexión SQL administrativa disponible. Las comprobaciones de RLS requieren esa activación y sesiones reales.

## Biblioteca y planes musicales

El catálogo inicial está en `src/modules/intranet/repertoire.json`: 37 entradas, con 45 fragmentos/canciones en Viking. Se usa el listado del propietario como versión principal; los títulos adicionales identificables se complementaron con el PowerPoint. No se importaron letras. Antonio Ríos contiene únicamente Quisiera recorrer tu cuerpo, Amigo mío y Nunca me faltes. Los títulos o tonalidades inciertos permanecen por confirmar.

Inventario observado el 1 de noviembre de 2026 en Cloudinary, carpeta BANDA BRUNA/Music BB: 30 audios. Los 30 enlaces MP3 fueron comprobados por HTTP HEAD (200 y audio/mpeg). Los originales no se reemplazaron: Cloudinary entrega MP3 por conversión de formato. Descargas con `fl_attachment`. El archivo `audio-assets.json` conserva public IDs, versiones y resultado de la verificación; no contiene claves API.

Pendientes de audio en ese inventario: Zalo Reyes, Koky, Eros Ramazzotti, Chileno, Merengue, Mix Bruna completo y Cuecas. Que un archivo exista no certifica su contenido: Antonio Ríos requiere confirmar que sea la edición de tres canciones. El catálogo no se sincroniza automáticamente con nuevas subidas; al agregar archivos se debe actualizar el vínculo correspondiente y volver a verificarlo con `node scripts/verify_intranet_audio.mjs`.

Material abre la biblioteca para todos los integrantes: búsqueda, filtro de sección, canciones/tonalidades, reproducción MP3, descarga y filtro de audios pendientes. Las pistas individuales dentro de un mix remiten al audio completo cuando no existe una grabación separada.

Dirección y jefatura pueden seleccionar un mix entero o una canción, ordenar el plan, elegir ensayo/show/nueva/personal y definir secuencia/bruto/mixto e indicaciones por selección. Se almacena en `intranet_entries.rehearsal.music`, por lo que no requiere una migración adicional a `intranet_setup.sql`. Los estados de lectura y restricciones por destinatario se conservan.

El PDF puede descargarse antes de publicar o desde un aviso publicado. Incluye canciones en orden, tonalidades, instrucciones, destinatarios, hora de Chile y enlaces de audio. Las rutas `/api/intranet/catalog` y `/api/intranet/rehearsal-pdf` exigen sesión autorizada; descargar un aviso publicado vuelve a comprobar sus permisos mediante RLS. La demostración local admite generar PDFs ficticios sin sesión únicamente en modo DEV; ese acceso está deshabilitado en producción.

Comprobaciones locales: `node scripts/test_intranet_repertoire.mjs` y `node scripts/test_intranet.mjs`. La primera genera un PDF de ejemplo en `output/pdf/ejemplo-plan-ensayo-bruna.pdf`.


### Actualización del inventario · 1 de noviembre de 2026, tarde

La carpeta contiene ahora 35 archivos. Se incorporaron los audios de Zalo Reyes, Eros Ramazzotti, Chileno (preview), Merengue y Cuecas. Se actualizaron los archivos vinculados de Viking 1, Avikingzao, Viking 2, Viking 4 y Vicente, conservando sus IDs de repertorio y selecciones existentes. Los cuatro archivos anteriores que ya no aparecen en la carpeta se retiraron del inventario vigente.

Estado vigente: 37 entradas de repertorio, 35 con audio y 2 pendientes: Mix Koky y su Banda Tropical y Mix Bruna completo. Mix Chileno está señalado como preliminar por el nombre del archivo. Las canciones, tonalidades e indicaciones existentes no cambian a partir de los nombres de los archivos nuevos.


## Tenidas LEGO y consolidado personal del evento

Ocho tenidas WebP (1200 × 800, 77–114 KB) subidas y verificadas en Cloudinary/BANDA BRUNA el 1 de noviembre de 2026. `outfits.json` conserva sus public IDs y enlaces públicos; las copias locales están en `public/assets/images/tenidas`. Las imágenes se generaron con la herramienta integrada de imágenes usando las referencias del propietario. Prompts en `output/imagegen/tenidas-prompts.json`.

Aplicar `scripts/intranet_events_setup.sql` después de `scripts/intranet_setup.sql`. Esta migración agrega detalles del evento, checklist personal, pagos por integrante protegidos por RLS y la función transaccional de publicación. Aún no aplicada: no se dispone de conexión SQL administrativa en este entorno.

Jaime y César seleccionan una tarjeta de tenida y completan salida, tocata, lugar, encuentro, consideraciones, pagos y setlist. Cada integrante administra su checklist; al descargar un evento publicado, el servidor obtiene pago y checklist de la sesión autenticada. Los pagos quedan fuera de la ficha compartida y los integrantes solo pueden consultar el suyo. Jefatura puede previsualizar borradores para cada destinatario.

El PDF incorpora imagen de tenida, fecha, horarios, lugar, pago personal, indicaciones, checklist y setlist ordenado con enlaces para escuchar y descargar MP3. Si una canción solo existe dentro de un mix, el enlace se identifica como mix completo. Las imágenes para PDF están embebidas desde copias locales confiables, sin depender de descargas externas.

Verificación: `node scripts/test_intranet_events.mjs` genera `output/pdf/consolidado-evento-ejemplo-bruna.pdf` y comprueba separación de pagos/checklists por sesión, ocho WebP y generación sin setlist. Pendiente validar RLS con sesiones reales tras aplicar las migraciones.


### Mix Koky incorporado · 1 de noviembre de 2026

Archivo `mix_koky_hozfdx`, original MP3 de 14,53 MB, en BANDA BRUNA/Music BB. Enlace versionado comprobado: HTTP 200 y audio/mpeg. Catálogo actualizado a 36 audios vinculados; solo falta Mix Bruna completo. Los títulos y tonalidades del mix siguen pendientes de confirmación por dirección musical.


### Mix Bruna completo incorporado · 1 de noviembre de 2026

Archivo `MIX_BRUNA_COMPLETO_AGONIA_-_LUNA_-_AHOGADO.mp3_ppmfj4`, original MP3 de 21,2 MB, en BANDA BRUNA/Music BB. Enlace versionado comprobado: HTTP 200 y audio/mpeg. Las 37 entradas del catálogo cuentan ahora con audio vinculado, sin pendientes. Conserva las tres canciones del mix y los audios individuales.

## Canal externo elegido: Web Push

El propietario eligió notificaciones push en lugar de WhatsApp. Implementación y activación en `scripts/INTRANET_PUSH_SETUP.md`; migraciones `intranet_push_setup.sql` y `intranet_push_delivery_setup.sql`. Las preparaciones de WhatsApp se conservan sin activar. Las claves VAPID locales permanecen privadas en `.env.push.local`, ignorado por Git. No se han desplegado ni enviado avisos reales.

## Agenda oficial coordinada con la intranet

La agenda del equipo consulta en vivo `eventos` con `publicado=true`, la misma fuente de las fechas oficiales. Se combina con ensayos y otras actividades internas y se actualiza al abrir o refrescar el panel (y durante la actualización periódica). No se copian shows a otra tabla. `/api/intranet/agenda` exige sesión de integrante y usa las políticas RLS existentes.

Jefatura puede elegir una fecha oficial al publicar una ficha de evento o tenida. Se guarda su ID en `event_details.official_event_id`; los avisos vinculados quedan agrupados en una actividad del calendario. La fecha, nombre y lugar oficiales tienen prioridad; la hora de tocata se completa en la ficha interna. Sin hora, se muestra «Hora por confirmar». Los PDFs de avisos vinculados vuelven a consultar la fuente oficial al descargarse. Si deja de estar publicada, la agenda avisa que hay que revisar el vínculo y no genera un consolidado con una fecha oficial desactualizada.

No requiere migración adicional de Supabase. Las fechas no publicadas permanecen fuera de esta consulta; las actividades presupuestadas internas siguen disponibles desde las fichas del equipo. No genera notificaciones push por consultar o sincronizar el calendario. Prueba: `node scripts/test_intranet_official_agenda.mjs`.
