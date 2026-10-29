# Retiro de radios y álbum Sesión Fiestas Patrias

Cambios preparados localmente; requieren commit y despliegue autorizados para entrar en producción.

- Se elimina el cron radial de Vercel y el workflow manual de GitHub.
- Se retiran el widget público y la pestaña del monitor en el dashboard.
- Las seis rutas de radio responden HTTP 410 sin consultar emisoras ni acceder a Supabase.
- No se borran tablas, catálogo ni historial. Los lectores internos quedan archivados en código; no hay migración SQL.
- El cron diario de seguidores y reproducciones no cambia.
- La tarjeta del álbum reemplaza el widget de radios. El anuncio superior, Música y la landing existente comparten el título, la portada y el Spotify oficial en `src/data/featuredAlbum.js`.
- Spotify confirmado: https://open.spotify.com/intl-es/album/0NiNk9a9cYn3SnK43lcR0x
- Los enlaces específicos del álbum en Apple Music, YouTube Music y otras plataformas quedan pendientes; no se sustituyen por enlaces inventados ni perfiles de artista.
- La vista de álbum no altera el registro de Supabase ni la fecha original del video, ni sus consultas de reproducciones. No se asigna al álbum la fecha de lanzamiento del video.

Verificación: prueba de retiro radial sin red/escrituras, pruebas de métricas y recepción social, compilación Astro.
