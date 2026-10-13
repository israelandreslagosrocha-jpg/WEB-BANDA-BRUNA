# Consultas automáticas — correcciones del 13 de octubre de 2026

## Programación única

- Radios: Vercel Pro, minutos 7 y 37 de cada hora. Hasta 48 escaneos diarios. El plan Pro del equipo se comprobó en Vercel. Las invocaciones siguen consumiendo recursos de funciones: no se promete costo cero.
- Redes y lanzamientos: GitHub Actions una vez al día, 12:17 UTC (09:17 de Chile en UTC-3). GitHub puede retrasar u omitir ejecuciones; el horario no es una garantía de puntualidad.
- El workflow radial de GitHub queda solo para disparos manuales. Se elimina el cron social de Vercel y el scraping dentro de `npm run build` para evitar consultas automáticas duplicadas.

## Extracción y guardado

El runner obtiene `/api/cron/social-manifest`, consulta los perfiles públicos y videos y entrega un snapshot reciente por POST a `/api/cron/sync-social`. Solo estas dos llamadas al sitio usan `CRON_SECRET`; nunca se envía a YouTube o redes. El runner no necesita la clave de servicio de Supabase ni instalar paquetes.

La recepción verifica autorización del cron, tamaño del cuerpo, antigüedad (máximo 15 minutos), estructura y cifras. No vuelve a consultar las redes: el cliente de servicio existente guarda los datos. El botón del dashboard mantiene una consulta manual explícita y autorizada, con el mismo extractor.

Se preserva el valor anterior cuando una fuente falla. En configuración solo se escriben las plataformas con nueva cifra válida. Los errores HTTP, formato, conexión o timeout quedan visibles; los errores de escritura no se informan como éxito.

En lanzamientos, las fechas y estados se guardan dentro de `plataformas_links`, sin nuevas columnas ni migraciones. Reproducciones y likes tienen fechas de verificación separadas; una actualización parcial no hace parecer nuevo el dato conservado. Se eliminan los mínimos artificiales y el requisito de que una cifra siempre aumente. La API pública ya no devuelve la hora actual como fecha de actualización ni inventa cifras cuando falla Supabase.

## Radios

Se rechazan identificadores de estación, publicidad y textos genéricos como canciones; se decodifican entidades HTML. Se reconoce Shoutcast por `/;` y se permite su ruta legacy cuando `/stats` falla. Se mantiene la selección exacta de emisora en servidores compartidos. Un compare-and-set del timestamp observado evita adquirir simultáneamente el mismo escaneo, con enfriamiento de 90 segundos y orden explícito que no prioriza filas sin fecha. La ejecución emite un resumen agregado en logs de Vercel.

Esto no convierte audio sin metadata en canciones identificables. Las fuentes sin endpoint adecuado o que no publican canciones siguen necesitando configuración específica. No se desactivan ni eliminan radios del catálogo.

## Verificación

Pruebas: `test_social_metrics.mjs`, `test_social_sync_routes.mjs`, `test_radio_metadata.mjs`, `test_radio_scan.mjs`, `test_security_remediation.mjs` y compilación Astro directa. Todas las pruebas de guardado usan Supabase simulado, no producción.

La lectura local pública obtuvo Instagram 3537, YouTube 975, TikTok 1154, Ahogado 26961 vistas/245 likes y Fiestas Patrias 14579 vistas/174 likes. Son evidencia de extracción local, no garantía de que las plataformas entreguen la misma respuesta desde un runner. Facebook no ofreció una cifra extraíble y el RSS devolvió 404: se notifican como limitaciones, sin inventar éxitos ni usar APIs pagadas.

## Activación pendiente

1. Publicar el mismo commit con rutas y workflows. No requiere nueva migración SQL ni secretos adicionales: se reutilizan los existentes.
2. Confirmar despliegue Ready y configuración radial en Cron Jobs de Vercel.
3. Ejecutar una vez el workflow social después de que las nuevas rutas estén desplegadas; revisar cifras y advertencias en los logs.
4. Verificar dos escaneos radiales programados consecutivos y sus resúmenes, y la próxima ejecución diaria de redes. El trabajo local no certifica estas ejecuciones futuras.
