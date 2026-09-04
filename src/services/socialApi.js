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
      { id: "fb_fiestas_patrias", title: "Continuamos trabajando para brindar un buen espectáculo estas fiestas patrias!! 🇨🇱🎵", url: "https://www.facebook.com/share/r/1BkeWALAF3/", thumbnail: "/assets/images/facebook/fb_fiestas_patrias.webp", duration: "0:45", category: "Facebook Reel" },
      { id: "fb_saludo_diego_urrutia", title: "¡Saludo especial de Diego Urrutia en ExpoMundoFamilia! 🎭🎤", url: "https://www.facebook.com/share/r/1H8uHmWAuZ/", thumbnail: "/assets/images/facebook/fb_saludo_diego_urrutia.webp", duration: "0:50", category: "Facebook Reel" },
      { id: "fb1", title: "Banda Bruna BB - Presentación y ritmo tropical en vivo 🎸🔥", url: "https://www.facebook.com/reel/918184277458701", thumbnail: "/assets/images/facebook/fb_reel_1.webp", duration: "0:45", category: "Facebook Reel" },
      { id: "fb2", title: "¡Vivimos una fiesta inolvidable sobre el escenario! 🎉 Banda Bruna", url: "https://www.facebook.com/reel/465715206013627", thumbnail: "/assets/images/facebook/fb_reel_2.webp", duration: "0:35", category: "Facebook Reel" },
      { id: "fb3", title: "Show en vivo y energía contagiosa con todo el público 💃🕺", url: "https://www.facebook.com/reel/447781014945781", thumbnail: "/assets/images/facebook/fb_reel_3.webp", duration: "0:50", category: "Facebook Reel" }
    ],
    "tiktok": [
      { id: "tt_dia_del_minero", title: "Banda Bruna BB - Día del Minero ⛏️🎶 #minero #bandabruna #musicaenvivo", url: "https://www.tiktok.com/@bandabrunaoficial/video/7672900759847013650", thumbnail: "/assets/images/tiktok/tiktok_minero.webp", duration: "0:56", category: "TikTok Oficial" },
      { id: "tt_vivo", title: "La previa y toda la energía del concierto de Banda Bruna 🎷🎶 #musicaenvivo", url: "https://www.tiktok.com/@bandabrunaoficial/video/7661480080421555463", thumbnail: "/assets/images/tiktok/tiktok_vivo.webp", duration: "0:45", category: "TikTok Oficial" },
      { id: "tt1", title: "Show en vivo y producción de Banda Bruna 🎬 #productora #cumbia", url: "https://www.tiktok.com/@bandabrunaoficial/video/7552604759543270667", thumbnail: "/assets/images/tiktok/tiktok_1.webp", duration: "1:00", category: "TikTok Oficial" },
      { id: "tt2", title: "Boroa Norte Toltén Chile... ¡Banda Bruna BB en el escenario! 🥁🔥", url: "https://www.tiktok.com/@bandabrunaoficial/video/7328464244482034949", thumbnail: "/assets/images/tiktok/tiktok_2.webp", duration: "1:15", category: "TikTok Oficial" },
      { id: "tt3", title: "Tributo a Antonio Ríos - El Maestro 🎶 #cumbia #musicaenvivo", url: "https://www.tiktok.com/@bandabrunaoficial/video/7523401411820817669", thumbnail: "/assets/images/tiktok/tiktok_3.webp", duration: "0:45", category: "TikTok Oficial" }
    ],
    "instagram": [
      { id: "ig_boca_de_lobos", title: "🎸 BANDA BRUNA EN VIVO — BOCA DE LOBOS, TEMUCO (18 Sep)", url: "https://www.instagram.com/p/Dc2aAJzuUC8/", thumbnail: "/assets/images/instagram/ig_boca_de_lobos.webp", duration: "0:45", category: "Instagram Reel" },
      { id: "ig_fuimos_enganados", title: "🛑🚨 FUIMOS ENGAÑADOS!!! 😔🤥 😡😡 Reel Humor Banda Bruna", url: "https://www.instagram.com/p/Db8kRMfuips/", thumbnail: "/assets/images/instagram/ig_fuimos_enganados.webp", duration: "0:45", category: "Instagram Reel" },
      { id: "ig_dia_del_minero", title: "Con cariños para los mineros ⛏️🎶 Canción de cumbia suena en vez del himno", url: "https://www.instagram.com/p/Db63NyKJ9bf/", thumbnail: "/assets/images/instagram/ig_dia_del_minero.webp", duration: "0:56", category: "Instagram Reel" },
      { id: "ig_trivia", title: "TRIVIA BRUNA: ¿Quién llega más tarde a los ensayos? 🤣🥁", url: "https://www.instagram.com/reel/DawSBQZJykb/", thumbnail: "/assets/images/instagram/trivia_ensayos.webp", duration: "1:00", category: "Instagram Reel" },
      { id: "ig_lanzamiento", title: "🔥 ¡YA DISPONIBLE \"AHOGADO EN UN BAR\"! Videoclip Oficial 🍻", url: "https://www.instagram.com/p/DaY5-_YCctx/", thumbnail: "/assets/images/instagram/lanzamiento_reel.webp", duration: "0:50", category: "Instagram Reel" }
    ]
  };
};

export const getInstagramFeed = () => {
  return [
    {
      id: "ig_boca_de_lobos",
      imageUrl: "/assets/images/instagram/ig_boca_de_lobos.webp",
      likes: 30,
      comments: 5,
      caption: `🎸 BANDA BRUNA EN VIVO — BOCA DE LOBOS, TEMUCO 🇨🇱🎶
Este 18 de septiembre, prepárate para una noche de música en vivo junto a Banda Bruna en Boca de Lobos, Temuco. Entradas disponibles en PortalTickets.`,
      username: "@banda_bruna",
      timeAgo: "Reciente",
      link: "https://www.instagram.com/p/Dc2aAJzuUC8/"
    },
    {
      id: "ig_fuimos_enganados",
      imageUrl: "/assets/images/instagram/ig_fuimos_enganados.webp",
      likes: 55,
      comments: 19,
      caption: `🛑🚨 FUIMOS ENGAÑADOS!!! 😔🤥 😡😡 
Esa no era esa la pregunta... Pero igual quedo chistoso el reel!! Comenta y comparte! #humor #comedia #parati #memes #cumbia`,
      username: "@banda_bruna",
      timeAgo: "Reciente",
      link: "https://www.instagram.com/p/Db8kRMfuips/"
    },
    {
      id: "ig_dia_del_minero",
      imageUrl: "/assets/images/instagram/ig_dia_del_minero.webp",
      likes: 44,
      comments: 12,
      caption: `Con cariños para los mineros ⛏️🎶 Canción de cumbia suena en vez del himno en el día del minero.
#diadelminero #cumbia #bandabruna #musicaenvivo`,
      username: "@banda_bruna",
      timeAgo: "Reciente",
      link: "https://www.instagram.com/p/Db63NyKJ9bf/"
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
    }
  ];
};

export const getFacebookFeed = () => {
  return [
    {
      id: "fb_fiestas_patrias",
      likes: 47,
      comments: 12,
      caption: "Continuamos trabajando para brindar un buen espectáculo estas fiestas patrias!! Y tú ¿cómo conoces a este tema? Cuéntanos en los comentarios!",
      timeAgo: "Reciente",
      imageUrl: "/assets/images/facebook/fb_fiestas_patrias.webp",
      link: "https://www.facebook.com/share/r/1BkeWALAF3/"
    },
    {
      id: "fb_saludo_diego_urrutia",
      likes: 85,
      comments: 18,
      caption: "Hola Amigos/as, este fin de semana en ExpoMundoFamilia tuvimos la oportunidad de compartir escenario con un grande de la comedia y el humor en nuestro país (#DiegoUrrutia)! Acá les compartimos un saludito que nos dejó!",
      timeAgo: "Reciente",
      imageUrl: "/assets/images/facebook/fb_saludo_diego_urrutia.webp",
      link: "https://www.facebook.com/share/r/1H8uHmWAuZ/"
    }
  ];
};

export const getTikTokFeed = () => {
  return [
    {
      id: "tt_dia_del_minero",
      imageUrl: "/assets/images/tiktok/tiktok_minero.webp",
      likes: 314,
      comments: 17,
      caption: "#minero #bandabruna #musicaenvivo ⛏️🎶 Canción de cumbia en el Día del Minero",
      username: "@bandabrunaoficial",
      timeAgo: "Reciente",
      link: "https://www.tiktok.com/@bandabrunaoficial/video/7672900759847013650"
    },
    {
      id: "tt_vivo_1",
      imageUrl: "/assets/images/tiktok/tiktok_vivo.webp",
      likes: 40,
      comments: 3,
      caption: "#musicaenvivo #bandabruna #ahogadoenunbar #productora #municipalidad",
      username: "@bandabrunaoficial",
      timeAgo: "Hace 2 días",
      link: "https://www.tiktok.com/@bandabrunaoficial/video/7661480080421555463"
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


