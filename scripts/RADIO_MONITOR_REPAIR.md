# Reparación del monitor radial — 6 octubre 2026

## Alcance

Se mantiene GitHub Actions cada 30 minutos (`7,37 * * * *`). No se agregan APIs de pago ni se cambian claves, políticas RLS o frecuencia. No requiere nueva migración SQL.

- Icecast selecciona el montaje solicitado; nunca toma la primera emisora como alternativa.
- Shoutcast reconoce servidores Sonic y conserva prefijos de proxy como `/8150/`.
- AzuraCast selecciona por shortcode o URL de montaje, respeta `is_online` e incorpora historial con fecha cuando está disponible.
- StreamTheWorld no interpreta el título de una página HTML como canción.
- Zeno sin endpoint configurado queda explícitamente sin fuente compatible.
- Lecturas HTTP limitadas a 16 simultáneas y 512 KiB, compartidas por endpoint dentro de cada ejecución. La confirmación usa otra lectura. Presupuesto de lectura: 65 segundos; consultas pendientes se identifican como no realizadas, sin actualizar su fecha.
- Los candidatos no confirmados dejan de insertarse como reproducciones históricas.
- Errores de escritura fallan el endpoint; errores de proveedores producen diagnóstico parcial. GitHub imprime resumen y resultado por radio sin URLs ni claves.
- El widget filtra correctamente `updated_at`; dashboard muestra fecha real de consulta y no equipara ausencia de metadata con desconexión del audio.

## Pruebas locales

`node scripts/test_radio_metadata.mjs`

`node scripts/test_radio_scan.mjs`

`node scripts/test_security_remediation.mjs`

`./node_modules/.bin/astro build` (lecturas de Supabase durante prerender; no usar `npm run build` para estas pruebas porque también ejecuta tareas de actualización de contenido).

## Validación después del despliegue

1. Ejecutar manualmente Monitor radial en Actions, una sola vez.
2. Comprobar resumen y resultados: `NO_MATCH` significa canción legible sin coincidencia; `SOURCE_MISMATCH`, `NO_SONG_METADATA`, `UNSUPPORTED_SOURCE`, `INVALID_METADATA`, `QUERY_ERROR`, `SOURCE_OFFLINE` y `SCAN_TIME_LIMIT` requieren revisión específica.
3. Comparar una emisora de interés con su metadata y audio en ese momento. Dos lecturas iguales confirman consistencia de metadata, **no prueban que esa metadata no esté retrasada respecto del audio**.
4. Revisar la siguiente ejecución programada y la fecha de última consulta del dashboard. GitHub puede retrasar el horario programado.

## Límites pendientes

- Un escaneo cada 30 minutos sigue pudiendo perder canciones entre consultas si el proveedor no publica historial.
- La lista no equivale a cobertura total: algunas emisoras solo publican audio o requieren endpoints específicos. Revisar los resultados de producción antes de configurar fuentes adicionales.
- La ventana de 60 segundos del endpoint es un enfriamiento, no un bloqueo transaccional global. La serialización de Actions evita solapes entre sus jobs, pero no garantiza exclusión con disparos manuales desde el dashboard.
- El diagnóstico detallado queda en los logs de Actions y en la respuesta del endpoint, no en una nueva tabla persistente.
- Esta reparación corresponde al endpoint Vercel usado por Actions/dashboard. No despliega ni modifica una función Edge histórica independiente.
