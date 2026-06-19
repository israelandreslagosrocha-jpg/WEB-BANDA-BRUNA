# Documento Maestro: Banda Bruna 2.0
## Centro de Operaciones Digital

Este documento actúa como la fuente de verdad única para el diseño, desarrollo, optimización SEO e integración de APIs de la plataforma digital **Banda Bruna 2.0**.

---

## 1. Información General y Enlaces de Interés

### Canales Oficiales y Fuentes de Consumo
* **Sitio Web Actual / Dominio**: [www.bandabruna.cl](http://www.bandabruna.cl)
* **YouTube**: [youtube.com/@bandabrunaoficial](https://www.youtube.com/@bandabrunaoficial)
* **Spotify**: [Banda Bruna en Spotify](https://open.spotify.com/intl-es/artist/3QpgBBp8CypsMEM5rgWo7D?si=d6dd0bb35c254d05)
* **Instagram**: [@banda_bruna](https://www.instagram.com/banda_bruna/)
* **Facebook**: [facebook.com/bandabruna](https://www.facebook.com/bandabruna)
* **TikTok**: [@bandabrunaoficial](https://www.tiktok.com/@bandabrunaoficial)

---

## 2. Arquitectura de la Información y URLs

El sitio web está diseñado como una plataforma dinámica integrada. Para maximizar el SEO y mantener una estructura limpia, se dividirá en las siguientes páginas principales:

### Estructura de URLs (`/`)
* **`/` (Home / Inicio)**: Landing page principal de conversión y novedades en tiempo real.
* **`/banda`**: Biografía oficial, historia de la banda y detalles de la trayectoria.
* **`/integrantes`**: Fichas biográficas de cada miembro de la banda (aporta al SEO de nombres propios y humaniza la marca).
* **`/musica`**: Centralizador de lanzamientos, catálogo de álbumes, letras y enlaces directos a streaming (Spotify, YouTube Music, Apple Music, Deezer).
* **`/videos`**: Galería de videos dinámica filtrada por listas de reproducción de YouTube (Oficiales, En vivo, Backstage).
* **`/agenda`**: Calendario interactivo con próximos shows, mapa/recinto, detalles de eventos e integración para añadir fechas al calendario personal (Google / iCal).
* **`/noticias`**: Blog oficial autoadministrable (CMS ligero vía Supabase) para hitos importantes.
* **`/galeria`**: Carrusel y cuadrícula gigante de fotos en alta definición de escenarios, público e hitos.
* **`/epk` (Prensa / Electronic Press Kit)**: Espacio exclusivo para productores y prensa con biografía corta, logos descargables, fotos oficiales de prensa y rider técnico (PDF).
* **`/contacto`**: Información directa, redes y accesos directos de booking.
* **`/contrataciones`**: Landing page agresiva de cotización con formulario de presupuesto detallado, enlaces a WhatsApp y correo corporativo.

---

## 3. Estrategia de SEO (Fase de Diseño Pre-programación)

La optimización de motores de búsqueda se incorpora desde el diseño del DOM y el esquema de metadatos.

### Palabras Clave Principales (Keywords Primarias)
* `banda bruna` (Temuco, Chile)
* `banda bruna temuco`
* `orquesta banda bruna`
* `grupo musical temuco`
* `cumbia chilena`
* `cumbia sureña`
* `show en vivo temuco`

### Palabras Clave Secundarias (Contexto comercial)
* `fiestas costumbristas chile`
* `banda de matrimonios temuco`
* `eventos corporativos araucania`
* `festivales del sur de chile`
* `musica en vivo cumbia`

### Implementación SEO en Astro
* **Metaetiquetas Dinámicas**: Títulos y descripciones únicos por página cargados de forma ágil desde el frontmatter de Astro.
* **Marcado de Datos Estructurados (JSON-LD)**:
  - Tipo `MusicGroup` para la home, integrando álbumes, enlaces a redes y miembros.
  - Tipo `Event` dinámico para cada concierto en la página de `/agenda` para que aparezcan automáticamente en las búsquedas de "Eventos en Temuco" en Google.
* **Imágenes Optimizadas**: Compresión automática a formato `.webp` y generación de tamaños responsivos utilizando la etiqueta `<Image />` de Astro.
* **Semántica HTML estricta**: Uso jerárquico de `<h1>` a `<h6>` respetando la estructura semántica y atributos `alt` descriptivos con keywords clave.

---

## 4. Diseño Visual y Estética "Banda Premium"

* **Fondo**: Oscuro absoluto (`#090d16` a `#020617`), simulando la penumbra del escenario.
* **Acentos**: 
  - Azul corporativo profundo de Banda Bruna (`#1e40af` / `#0369a1`) que genera una sensación de solidez y profesionalismo.
  - Oro/Bronce vibrante (`#e5a93b` / `#d4af37`) para elementos interactivos, botones de acción secundaria y badges importantes.
* **Espaciado (Aire Visual)**: Secciones amplias (`py-24` a `py-32` en Tailwind) que otorgan un look sofisticado de festival de música internacional.
* **Elementos Gráficos**:
  - Efectos de desenfoque de fondo (glassmorphic navbars).
  - Sombras de colores y resplandores dorados/azules suaves en tarjetas.
  - Gradientes elegantes sobre textos importantes para emular luces de escenario.

---

## 5. Integración Tecnológica e Interfaces de API (Automatización)

La web actúa como un cliente que consume y centraliza datos para evitar tareas repetitivas de mantenimiento:

```mermaid
graph TD
    subgraph Redes Sociales
        YT[YouTube API]
        IG[Meta Graph API / Instagram]
        FB[Meta Graph API / Facebook]
        SP[Spotify API]
    end

    subgraph Base de Datos / CMS
        SB[(Supabase)]
    end

    subgraph Plataforma Web (Astro)
        Frontend[Sitio Web Astro + Tailwind]
    end

    YT -->|Últimos videos & playlists| Frontend
    IG -->|Feed de fotos y Reels| SB
    FB -->|Eventos y anuncios| SB
    SP -->|Discografía & Top temas| Frontend
    SB -->|Almacenamiento caché y CMS| Frontend
```

### Detalle de Módulos Automáticos

1. **Módulo 1: Último Videoclip Automático**
   - **Funcionamiento**: Query diaria al API de YouTube para obtener el último video subido a la playlist de "Videoclips Oficiales".
   - **En la Web**: El Hero principal reproduce en bucle y silenciado el fondo de este video (vía iframe embebido de YouTube optimizado) e inserta el título y enlace dinámicamente.

2. **Módulo 2: Biblioteca de Videos (`/videos`)**
   - **Funcionamiento**: Consumo del endpoint de playlists del canal oficial.
   - **Filtros**: Pestañas interactivas conectadas a los IDs de listas de reproducción de YouTube:
     - *Videoclips Oficiales*
     - *En Vivo*
     - *Backstage*
     - *Promocionales*

3. **Módulo 3: Instagram Sincronizado**
   - **Funcionamiento**: Un script de backend en Supabase Edge Functions sincroniza los últimos 6 posts y el último Reel usando la API básica de Meta. Almacena las URL de las imágenes y descripciones localmente en Supabase para evitar llamadas lentas al API de Meta y prevenir que la expiración de tokens rompa la visualización en caliente.

4. **Módulo 4: Facebook / Agenda Sincronizada**
   - **Funcionamiento**: Obtención de los eventos organizados por la página oficial de Facebook o inserción a través de un panel de administración personalizado en Supabase.

5. **Módulo 5: Agenda con Acciones Especiales (`/agenda`)**
   - **Funcionamiento**: Listado detallado de fechas.
   - **Características**:
     - Filtro por estado (Confirmado / Por Confirmar).
     - Botón "Añadir a Calendario" (generación dinámica de enlaces para Google Calendar e iCal mediante parámetros URL).
     - Enlace al mapa del recinto.

6. **Módulo 6: Lanzamientos / Spotify**
   - **Funcionamiento**: Embed de Spotify API que extrae las últimas canciones y el reproductor nativo del perfil del artista de manera dinámica.

7. **Módulo 7: Noticias y CMS (Supabase)**
   - **Funcionamiento**: Base de datos Postgres en Supabase con interfaz sencilla (puede ser integrada con un CMS headless como Keystatic o Decap CMS o un panel simple de administración web). Permite crear entradas breves para "Noticias", "Integrantes" y coordinar fechas de conciertos directamente.

8. **Módulo 8: Módulo de Contrataciones Agresivo**
   - **Funcionamiento**: Múltiples puntos de contacto directos:
     - Botón flotante persistente de WhatsApp.
     - Botón directo de envío de Correo.
     - Formulario interactivo detallado (Nombre, Email, Teléfono, Tipo de Evento, Ciudad, Presupuesto estimado, Fecha, Mensaje) que envía notificaciones inmediatas por correo (mediante Resend o Supabase Edge Functions).

---

## 6. Pendientes e Ideas Futuras

- [ ] Instalar entorno Astro en la raíz del proyecto.
- [ ] Configurar Tailwind CSS y su sistema de diseño (colores corporativos, fuentes, espaciados).
- [ ] Desarrollar los componentes comunes (Navbar glassmorphic, Footer completo con feeds, Botones estilizados).
- [ ] Diseñar y crear las páginas detalladas (`/index.astro`, `/agenda.astro`, `/videos.astro`, `/contrataciones.astro`, `/integrantes.astro`, `/epk.astro`).
- [ ] Crear la estructura de servicios de APIs (archivos mock iniciales en `src/services/` que simulan datos de YouTube, Spotify e Instagram para el desarrollo local ágil sin credenciales).
- [ ] Diseñar el esquema de base de datos en Supabase para Fechas, Integrantes y Noticias.
- [ ] Configurar el despliegue automático conectado a GitHub en Vercel o Netlify.
