// Mock Social API Service for Banda Bruna 2.0
// This module simulates dynamic content from YouTube, Instagram, Facebook, Spotify, and a local CMS.
// In the future, this can be connected to real endpoints by updating these functions.

export const getLatestVideo = () => {
  return {
    id: "mZhYl60ENAs",
    title: "AHOGADO EN UN BAR (VIDEOCLIP OFICIAL)",
    type: "Videoclip Oficial",
    youtubeUrl: "https://www.youtube.com/watch?v=mZhYl60ENAs",
    embedUrl: "https://www.youtube.com/embed/mZhYl60ENAs?autoplay=1&mute=1&loop=1&playlist=mZhYl60ENAs&controls=0&showinfo=0&rel=0&modestbranding=1",
    thumbnail: "https://i.ytimg.com/vi/mZhYl60ENAs/maxresdefault.jpg",
    publishedAt: "Reciente"
  };
};

export const getVideoPlaylists = () => {
  return {
    "youtube": [
      { id: "yt_ahogado", title: "Banda Bruna - Ahogado en un Bar (Videoclip Oficial)", url: "https://www.youtube.com/watch?v=mZhYl60ENAs", embedId: "mZhYl60ENAs", thumbnail: "https://i.ytimg.com/vi/mZhYl60ENAs/hqdefault.jpg", duration: "3:40", category: "YouTube Oficial" },
      { id: "yt1", title: "Banda Bruna - Luna Amiga (Videoclip Oficial)", url: "https://www.youtube.com/watch?v=bcHvOVSqYrY", embedId: "bcHvOVSqYrY", thumbnail: "https://i.ytimg.com/vi/bcHvOVSqYrY/hqdefault.jpg", duration: "3:10", category: "YouTube Oficial" },
      { id: "yt2", title: "Banda Bruna - Agonía (Sesión En Vivo)", url: "https://www.youtube.com/watch?v=p_zdcQEEOFY", embedId: "p_zdcQEEOFY", thumbnail: "https://i.ytimg.com/vi/p_zdcQEEOFY/hqdefault.jpg", duration: "4:20", category: "YouTube Oficial" },
      { id: "yt3", title: "Banda Bruna - Mix Cumbias Clásicas (Sesión En Vivo)", url: "https://www.youtube.com/watch?v=jhuzbKVCjuo", embedId: "jhuzbKVCjuo", thumbnail: "https://i.ytimg.com/vi/jhuzbKVCjuo/hqdefault.jpg", duration: "8:45", category: "YouTube Oficial" },
      { id: "yt4", title: "Banda Bruna - Mix Vikings 5 (Show En Vivo)", url: "https://www.youtube.com/watch?v=_94TmNOeKA4", embedId: "_94TmNOeKA4", thumbnail: "https://i.ytimg.com/vi/_94TmNOeKA4/hqdefault.jpg", duration: "7:15", category: "YouTube Oficial" }
    ],
    "facebook": [
      { id: "fb_reel_1572889367878240", title: "Banda Bruna BB - Presentación y ritmo tropical en vivo 🎸🔥", url: "https://www.facebook.com/reel/1572889367878240/", thumbnail: "https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414125/compressed_DSC01108_gh6sl8.webp", duration: "0:45", category: "Facebook Reel" },
      { id: "fb_reel_4520812758195702", title: "¡Vivimos una fiesta inolvidable sobre el escenario! 🎉 Banda Bruna", url: "https://www.facebook.com/reel/4520812758195702/", thumbnail: "https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414193/compressed_20250322-_DSC8451_tfvkgj.webp", duration: "0:35", category: "Facebook Reel" },
      { id: "fb_reel_1919974456057548", title: "Show en vivo y energía contagiosa con todo el público 💃🕺", url: "https://www.facebook.com/reel/1919974456057548/", thumbnail: "https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414183/compressed_20250322-_DSC7731_smf5lp.webp", duration: "0:50", category: "Facebook Reel" },
      { id: "fb_reel_1982889122342689", title: "Lo mejor de nuestra gira por festivales y eventos del sur 🎶❤️", url: "https://www.facebook.com/reel/1982889122342689/", thumbnail: "https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414136/compressed_DSC00739_ebt6ni.webp", duration: "0:40", category: "Facebook Reel" },
      { id: "fb_reel_1703217417670134", title: "Comenta y comparte!! Esto es solo un adelanto de nuestro trabajo! 🎬 Banda Bruna BB", url: "https://www.facebook.com/reel/1703217417670134/", thumbnail: "https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414150/compressed_DSC02307_ca2wcv.webp", duration: "0:30", category: "Facebook Reel" }
    ],
    "tiktok": [
      { id: "tt_7659982007669214471", title: "Banda Bruna BB - Show en vivo y backstage 🥁🔥 #cumbia #musica", url: "https://www.tiktok.com/@bandabrunaoficial/video/7659982007669214471", thumbnail: "https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414182/compressed_20250322-_DSC8018_bqynkm.webp", duration: "0:45", category: "TikTok Oficial" },
      { id: "tt_7660903502633372946", title: "¡Gracias por cantar y bailar con nosotros en cada escenario! ❤️", url: "https://www.tiktok.com/@bandabrunaoficial/video/7660903502633372946", thumbnail: "https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414191/compressed_20250322-_DSC8359_pl7ubh.webp", duration: "0:50", category: "TikTok Oficial" },
      { id: "tt_7661073934871317768", title: "Ritmo, cumbia y alegría sureña sobre el escenario 🎬✨ #bandabruna", url: "https://www.tiktok.com/@bandabrunaoficial/video/7661073934871317768", thumbnail: "https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414152/compressed_DSC02356_1_l5mqsc.webp", duration: "0:40", category: "TikTok Oficial" },
      { id: "tt_7661480080421555463", title: "La previa y toda la energía del concierto de Banda Bruna 🎷🎶", url: "https://www.tiktok.com/@bandabrunaoficial/video/7661480080421555463", thumbnail: "https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414172/compressed_20250201230759_DSC00081_1_jv8mqo.webp", duration: "0:35", category: "TikTok Oficial" },
      { id: "tt_7662184291538832647", title: "¡Nos vemos en la próxima fiesta! Banda Bruna BB en vivo 💃🕺", url: "https://www.tiktok.com/@bandabrunaoficial/video/7662184291538832647", thumbnail: "https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414189/compressed_20250322-_DSC8302_iiqi8k.webp", duration: "0:55", category: "TikTok Oficial" }
    ],
    "instagram": [
      { id: "ig_reel_Dag495zuVO9", title: "Banda Bruna BB - Reel Oficial 🎵✨", url: "https://www.instagram.com/reel/Dag495zuVO9/", thumbnail: "https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414189/compressed_20250322-_DSC8302_iiqi8k.webp", duration: "0:45", category: "Instagram Reel" },
      { id: "ig_reel_DZpvNd-uBjx", title: "Un pequeño resumen del proceso de grabación de nuestro videoclip... 🎬", url: "https://www.instagram.com/reel/DZpvNd-uBjx/", thumbnail: "https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414123/compressed_DSC01050_r8fjdr.webp", duration: "0:45", category: "Instagram Reel" },
      { id: "ig_reel_Dan6pQYJJT7", title: "Agencia CK & Banda Bruna - Producción y show audiovisual 🔥", url: "https://www.instagram.com/reel/Dan6pQYJJT7/", thumbnail: "https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414120/compressed_DSC00983_tcabl4.webp", duration: "0:50", category: "Instagram Reel" },
      { id: "ig_reel_DarYCJZupXO", title: "Momentos inolvidables en el escenario con el público 🎶❤️", url: "https://www.instagram.com/reel/DarYCJZupXO/", thumbnail: "https://res.cloudinary.com/dhgifjpkh/image/upload/v1784414124/compressed_DSC00953_zemfwn.webp", duration: "0:40", category: "Instagram Reel" },
      { id: "ig_reel_DawSBQZJykb", title: "TRIVIA BRUNA CAPÍTULO 1: ¿Quién llega más tarde a los ensayos? 🤣🥁", url: "https://www.instagram.com/reel/DawSBQZJykb/", thumbnail: "/assets/images/instagram/trivia_ensayos.webp", duration: "1:00", category: "Instagram Reel" }
    ]
  };
};

export const getInstagramFeed = () => {
  return [
    {
      id: "ig_trivia_1",
      imageUrl: "/assets/images/instagram/trivia_ensayos.webp",
      likes: 69,
      comments: 29,
      caption: `BIENVENIDOS A LA TRIVIA BRUNA CAPITULO 1:
¿QUIEN LLEGA MAS TARDE A LOS ENSAYOS?
.
.
.
.
.
.
.
.
.
#cumbia #chile #viral #bandabruna #musica`,
      username: "@banda_bruna",
      timeAgo: "Hace 1 día",
      link: "https://www.instagram.com/p/DawSBQZJykb/"
    },
    {
      id: "ig_lanzamiento",
      imageUrl: "/assets/images/instagram/lanzamiento_reel.webp",
      likes: 624,
      comments: 57,
      caption: `🔥 ¡YA DISPONIBLE "AHOGADO EN UN BAR"! 🍻
El videoclip oficial ya está activo. Agradecemos a todos por su inmenso apoyo. ¡Vayan a verlo, escucharlo y compartirlo con todos sus amigos! 🎸🎶`,
      username: "@banda_bruna",
      timeAgo: "Hace 1 día",
      link: "https://www.instagram.com/p/DaY5-_YCctx/"
    },
    {
      id: "ig1",
      imageUrl: "/assets/images/instagram/covers_vs_originales.webp",
      likes: 33,
      comments: 7,
      caption: `Que prefieres que grabemos? 👀 Covers o Temas originales? 🤔🧐 Ese es el dilema siempre escuchamos que la gente quiere escuchar temas nuevo, pero tienen los temas originales la misma fuerza que un tema ya probado en otro estilos?🧐💬 Déjanos tu comentario es muy útil para nosotros... Y te enviamos a suscribirte en nuestro canal de YouTube Banda Bruna oficial.`,
      username: "@banda_bruna",
      timeAgo: "Hace 2 días",
      link: "https://www.instagram.com/p/DaiUuuLKw3s/"
    },
    {
      id: "ig2",
      imageUrl: "/assets/images/instagram/segunda_publicacion.webp",
      likes: 512,
      comments: 31,
      caption: "Próximamente en todas nuestras plataformas",
      username: "@banda_bruna",
      timeAgo: "Hace 2 días",
      link: "https://www.instagram.com/p/DZkqDn1uNpC/"
    },
    {
      id: "ig3",
      imageUrl: "/assets/images/instagram/quinta_publicacion.webp",
      likes: 287,
      comments: 18,
      caption: "Día de la Madre! Comuna de Freire! Gracias Mamitas lindas!",
      username: "@banda_bruna",
      timeAgo: "Hace 4 días",
      link: "https://www.instagram.com/p/DYPkzvxjlVU/?img_index=1"
    }
  ];
};

export const getFacebookFeed = () => {
  return [
    {
      id: "fb1",
      likes: 47,
      comments: 12,
      caption: "Nos llegó este saludo de los Chicos Mágicos! Tremendos músicos y cantantes de nuestro país que hoy nos envían su apoyo desde Santiago. No olvides visitar nuestro canal de YouTube y dejarnos tu comentario sobre nuestro nuevo tema Ahogado en un Bar!",
      timeAgo: "Hace 2 días",
      imageUrl: "/assets/images/facebook/chicos_magicos.webp",
      link: "https://www.facebook.com/reel/1919974456057548"
    },
    {
      id: "fb2",
      likes: 85,
      comments: 6,
      caption: "Agradecemos a la Municipalidad de Valdivia por la excelente acogida en las Fiestas Costumbristas. ¡Público espectacular!",
      timeAgo: "Hace 6 días",
      link: "https://facebook.com/bandabruna/posts/2"
    }
  ];
};

export const getTikTokFeed = () => {
  return [
    {
      id: "tt_vivo_1",
      imageUrl: "/assets/images/tiktok/tiktok_vivo.webp",
      likes: 40,
      comments: 3,
      caption: "#musicaenvivo #bandabruna #ahogadoenunbar #productora #municipalidad",
      username: "@bandabrunaoficial",
      timeAgo: "Hace 2 días",
      link: "https://www.tiktok.com/@bandabrunaoficial/video/7661480080421555463"
    },
    {
      id: "tt_nuevo",
      imageUrl: "/assets/images/tiktok/tiktok_nuevo.webp",
      likes: 1200,
      comments: 78,
      caption: "#ahogadoenunbar #musicaenvivo #bandaenvivo #productora",
      username: "@bandabrunaoficial",
      timeAgo: "Hace 1 día",
      link: "https://www.tiktok.com/@bandabrunaoficial/video/7659638967054126354"
    }
  ];
};

export const getUpcomingEvents = () => {
  return [];
};

export const getNews = () => {
  return [
    {
      id: "news_ahogado",
      slug: "banda-bruna-bb-encendera-el-invierno-con-su-nueva-cumbia-ahogado-en-un-bar",
      title: "Banda Bruna BB encenderá el invierno con su nueva cumbia \"Ahogado en un bar\"",
      summary: "La escena tropical de la Región de La Araucanía se prepara para un estreno importante. La Banda Bruna anunció el rodaje de su segundo videoclip para su tema original \"Ahogado en un bar\", grabado en Cervecería Maquehue y Centro de Eventos Araucaria en Padre las Casas.",
      content: `La escena tropical de la Región de La Araucanía se prepara para un importante estreno. La Banda Bruna anunció el rodaje de su segundo videoclip, para su nuevo tema original «Ahogado en un bar». El proyecto, que se registrará bajo el ritmo y la energía de la cumbia tropical, tuvo como locaciones de grabación la Cervecería Maquehue (Padre las Casas, IX Región de la Araucanía - https://www.instagram.com/cervezamaquehue/?hl=es) y el Centro de Eventos Araucaria (Padre las Casas - https://www.instagram.com/centro_eventos_araucaria/?hl=es), lo que promete capturar la atmósfera perfecta para la canción. La producción visual estará en manos de la reconocida Agencia CK, lo que asegura un estándar de calidad técnica y artística de primer nivel para la escena local.

¿Cuándo se estrena? Los fanáticos no tendrán que esperar mucho. El videoclip y la canción de BandaBruna estarán disponibles en todas las plataformas digitales a partir de mediados de junio. Con «Ahogado en un bar», la agrupación busca consolidar su propuesta musical y hacer bailar a todo el público del país.

Sigue el minuto a minuto el proceso de grabación, que traerá sorpresas y registros exclusivos tras bambalinas. Recuerda mantenerte informado de todos los detalles del rodaje y el lanzamiento en nuestras redes sociales oficiales como bandabruna_oficial.`,
      publishedAt: "29 de mayo, 2026",
      category: "Noticias",
      image: "/assets/images/noticias/ahogado_bar.webp",
      tiktoks: ["7651491620336061714", "7651986871995600135"],
      gallery: [
        "https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910903/compressed_IMG_6752_muxcrr.webp",
        "https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910902/compressed_IMG_6753_mbptzg.webp",
        "https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910901/compressed_IMG_6754_aqr1i8.webp",
        "https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910900/compressed_IMG_6755_zrkkil.webp",
        "https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910899/compressed_IMG_6756_drc3lc.webp",
        "https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910894/compressed_IMG_6760_nuvlrv.webp",
        "https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910897/compressed_IMG_6757_ogzsly.webp",
        "https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910897/compressed_IMG_6758_navguv.webp",
        "https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910896/compressed_IMG_6759_uusspl.webp",
        "https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910893/compressed_IMG_6761_x5jldh.webp",
        "https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910892/compressed_IMG_6762_fkhxuu.webp",
        "https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910890/compressed_IMG_6765_dzrv4n.webp",
        "https://res.cloudinary.com/dhgifjpkh/image/upload/v1781910888/compressed_IMG_6769_etx3ed.webp",
        "https://res.cloudinary.com/dhgifjpkh/image/upload/v1781907221/compressed_de76bea3-41a6-4a33-b9de-18ecfe0118aa_pco6zo.webp"
      ],
      videos: [
        "https://res.cloudinary.com/dhgifjpkh/video/upload/v1781910507/5d4418d0-6b17-4034-8ddc-58b3ee92db08_ubfdlx.mp4",
        "https://res.cloudinary.com/dhgifjpkh/video/upload/v1781910507/757c793c-3f28-4861-8be5-b383b2045af1_ggzjfz.mp4"
      ]
    },
    {
      id: "news_tolten_orquesta",
      slug: "banda-bruna-sera-la-orquesta-oficial-del-primer-festival-tolten-a-toda-costa",
      title: "Banda Bruna será la orquesta oficial del primer festival «Toltén a Toda Costa»",
      summary: "Una fiesta del talento vocal en la Costa Araucanía, Nueva Toltén. La Banda Bruna ha sido confirmada como la orquesta oficial del certamen que une a jóvenes talentos de cinco comunas de la zona.",
      content: `Una fiesta del talento vocal en la Costa Araucanía, Nueva Toltén, Chile.

La escena musical de la Región de La Araucanía se prepara para un hito cultural: el debut del Festival de la Voz «Toltén a Toda Costa». En esta histórica primera edición, la destacada agrupación local Banda Bruna ha sido confirmada como la orquesta oficial, encargada de dar vida y soporte musical a los nuevos talentos de la zona. 

Con 20 canciones en competencia y dos categorías por edad, el evento infantojuvenil se llevará a cabo el próximo sábado 11 de abril 2026, a partir de las 19:00 horas, en el Salón Multiuso de la Municipalidad de Toltén.

Uniendo a la Costa Araucanía, este certamen no solo busca una voz ganadora, sino que actúa como un puente de integración para jóvenes talentos (entre 9 y 25 años) provenientes de cinco comunas hermanas: Carahue, Teodoro Schmidt, Nueva Imperial, Saavedra y los anfitriones de Toltén.`,
      publishedAt: "7 de abril, 2026",
      category: "Noticias",
      image: "/assets/images/noticias/tolten_orquesta.webp",
      tiktoks: []
    },
    {
      id: "news_verano",
      slug: "gracias-por-un-verano-inolvidable",
      title: "¡Gracias por un verano inolvidable!",
      summary: "Cierre de Gira Verano 2026 en Pocoyán. Tras una intensa temporada recorriendo diversos escenarios y compartiendo nuestra música, llega el momento de despedir un ciclo lleno de alegría y dar el gran cierre en la Gran Fiesta Costumbrista.",
      content: `¡Gracias por un verano inolvidable! Cierre de Gira Verano 2026 en Pocoyán.

Tras una intensa temporada recorriendo diversos escenarios y compartiendo nuestra música, llega el momento de despedir un ciclo lleno de alegría. Este domingo 08 de marzo a las 19:00 horas, los esperamos en la Gran Fiesta Costumbrista de Pocoyán (Comuna de Toltén) para dar el gran cierre a nuestra Gira Verano 2026.

Ha sido una temporada increíble, donde tuvimos la oportunidad de presentarnos en las regiones de Biobío, La Araucanía y Los Ríos. Queremos agradecer profundamente a cada persona que nos brindó su cariño, ya sea con un aplauso o simplemente disfrutando con nosotros. Nuestra gratitud también para los productores y municipalidades que confiaron en el talento de Banda Bruna.

¡Esto no termina aquí! En los próximos meses seguiremos realizando shows y trabajando en nuevos temas y sorpresas. Los invitamos a seguir conectados en nuestras redes sociales para no perderse lo que viene.`,
      publishedAt: "4 de marzo, 2026",
      category: "Noticias",
      image: "/assets/images/noticias/verano_tolten.webp",
      tiktoks: []
    }
  ];
};

export const getSpotifyAlbum = () => {
  return {
    artistId: "3QpgBBp8CypsMEM5rgWo7D",
    albumName: "Banda Bruna",
    spotifyEmbedUrl: "https://open.spotify.com/embed/artist/3QpgBBp8CypsMEM5rgWo7D?utm_source=generator&theme=0",
    topTracks: [
      { id: "s1", title: "Agonía", playCount: "154,230", duration: "4:20" },
      { id: "s2", title: "La boda del chupacabras", playCount: "112,850", duration: "3:15" },
      { id: "s3", title: "Luna Amiga", playCount: "98,400", duration: "3:10" }
    ]
  };
};

export const getBandMembers = () => {
  return [
    {
      name: "Cesar Bruna",
      role: "Voz principal",
      image: "/assets/images/banda/cesar_bruna.webp",
      instagram: "https://www.instagram.com/bruna.cantante/",
      bio: "La voz y el carisma al frente de Banda Bruna, conectando al público con el alma y el ritmo de la cumbia sureña."
    },
    {
      name: "Fabian Garrido",
      role: "Güiro y animación",
      image: "/assets/images/banda/fabian_garrido.webp",
      instagram: "https://www.instagram.com/fabian.gaes/",
      bio: "El brillo indispensable de la cumbia, aportando el sonido metálico del güiro y la percusión menor."
    },
    {
      name: "Vicente Nuñez",
      role: "Guitarrista y director musical",
      image: "/assets/images/banda/vicente_nunez.webp",
      instagram: "https://www.instagram.com/nunezenun_4/",
      bio: "Creador de las armonías y riffs de guitarra, guiando la dirección musical y la energía en el escenario."
    },
    {
      name: "Gerson Ulloa",
      role: "Bajista",
      image: "/assets/images/banda/gerson_ulloa.webp",
      instagram: "https://www.instagram.com/geruson79/",
      bio: "El groove y la profundidad del bajo eléctrico que le da cuerpo a la propuesta tropical de la banda."
    },
    {
      name: "Jaime Cardenas Quilodrán",
      role: "Percusión/Timbal/Talkback/Voces",
      image: "/assets/images/banda/jaime_quilodran.webp",
      instagram: "https://www.instagram.com/jaime.wavv/",
      bio: "El motor de la batería, asegurando la potencia y el tempo perfecto en cada presentación en vivo."
    },
    {
      name: "Jaime Cardenas Sanhueza",
      role: "Congas/Bongos/Percusión/Coros",
      image: "/assets/images/banda/jaime_sanhueza.webp",
      instagram: "https://www.instagram.com/jaime_cardenas_s/",
      bio: "El latido rítmico de la banda, dominando las congas y los bongos para encender la pista de baile."
    },
    {
      name: "Israel Lagos Rocha",
      role: "Pianos/Teclados/Sintetizadores",
      image: "/assets/images/banda/israel_lagos.webp",
      instagram: "https://www.instagram.com/andresromusic/",
      bio: "Teclados y sintetizadores que crean los ganchos melódicos y las secuencias de nuestro show."
    }
  ];
};

export const getMemberVideo = (name, type) => {
  if (!name) return "";
  const norm = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (norm.includes("cesar")) {
    return type === "banda"
      ? "https://res.cloudinary.com/dhgifjpkh/video/upload/v1783397923/21_ityujj.mp4"
      : "https://res.cloudinary.com/dhgifjpkh/video/upload/v1783397919/23_xutmb8.mp4";
  }
  if (norm.includes("fabian")) {
    return type === "banda"
      ? "https://res.cloudinary.com/dhgifjpkh/video/upload/v1783397921/31_izteaa.mp4"
      : "https://res.cloudinary.com/dhgifjpkh/video/upload/v1783397921/32_qjjyld.mp4";
  }
  if (norm.includes("vicente")) {
    return type === "banda"
      ? "https://res.cloudinary.com/dhgifjpkh/video/upload/v1783397923/33_egwnqe.mp4"
      : "https://res.cloudinary.com/dhgifjpkh/video/upload/v1783397922/35_vdj2po.mp4";
  }
  if (norm.includes("gerson")) {
    return type === "banda"
      ? "https://res.cloudinary.com/dhgifjpkh/video/upload/v1783397919/28_zpag2l.mp4"
      : "https://res.cloudinary.com/dhgifjpkh/video/upload/v1783397921/30_lwzzaw.mp4";
  }
  if (norm.includes("quilodran") || (norm.includes("jaime") && norm.includes("quil"))) {
    return type === "banda"
      ? "https://res.cloudinary.com/dhgifjpkh/video/upload/v1783398437/24_zd82r1.mp4"
      : "https://res.cloudinary.com/dhgifjpkh/video/upload/v1783397919/25_lmlbtd.mp4";
  }
  if (norm.includes("sanhueza") || (norm.includes("jaime") && !norm.includes("quil"))) {
    return type === "banda"
      ? "https://res.cloudinary.com/dhgifjpkh/video/upload/v1783397924/26_xikb2b.mp4"
      : "https://res.cloudinary.com/dhgifjpkh/video/upload/v1783397921/27_kea8ik.mp4";
  }
  if (norm.includes("israel") || norm.includes("lagos")) {
    return type === "banda"
      ? "https://res.cloudinary.com/dhgifjpkh/video/upload/v1783397921/36_fudbs6.mp4"
      : "https://res.cloudinary.com/dhgifjpkh/video/upload/v1783397923/38_qlb0uz.mp4";
  }
  return "";
};

export const getCustomRole = (name, currentRole) => {
  if (!name) return currentRole || "";
  const norm = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (norm.includes("vicente")) {
    return "Guitarrista y director musical";
  }
  if (norm.includes("gerson")) {
    return "Bajista";
  }
  if (norm.includes("fabian")) {
    return "Güiro y animación";
  }
  return currentRole || "";
};


