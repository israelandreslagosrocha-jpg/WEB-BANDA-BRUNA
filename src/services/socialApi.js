// Mock Social API Service for Banda Bruna 2.0
// This module simulates dynamic content from YouTube, Instagram, Facebook, Spotify, and a local CMS.
// In the future, this can be connected to real endpoints by updating these functions.

export const getLatestVideo = () => {
  return {
    id: "p_zdcQEEOFY",
    title: "AGONÍA (SESIÓN EN VIVO)",
    type: "Sesión En Vivo",
    youtubeUrl: "https://www.youtube.com/watch?v=p_zdcQEEOFY",
    embedUrl: "https://www.youtube.com/embed/p_zdcQEEOFY?autoplay=1&mute=1&loop=1&playlist=p_zdcQEEOFY&controls=0&showinfo=0&rel=0&modestbranding=1",
    thumbnail: "/assets/images/youtube/latest_yt_cover.webp",
    publishedAt: "Reciente"
  };
};

export const getVideoPlaylists = () => {
  return {
    "youtube": [
      { id: "yt1", title: "Banda Bruna - Luna Amiga (Videoclip Oficial)", url: "https://www.youtube.com/watch?v=bcHvOVSqYrY", embedId: "bcHvOVSqYrY", thumbnail: "https://i.ytimg.com/vi/bcHvOVSqYrY/hqdefault.jpg", duration: "3:10", category: "YouTube Oficial" },
      { id: "yt2", title: "Banda Bruna - Agonía (Sesión En Vivo)", url: "https://www.youtube.com/watch?v=p_zdcQEEOFY", embedId: "p_zdcQEEOFY", thumbnail: "https://i.ytimg.com/vi/p_zdcQEEOFY/hqdefault.jpg", duration: "4:20", category: "YouTube Oficial" },
      { id: "yt3", title: "Banda Bruna - Mix Cumbias Clásicas (Sesión En Vivo)", url: "https://www.youtube.com/watch?v=jhuzbKVCjuo", embedId: "jhuzbKVCjuo", thumbnail: "https://i.ytimg.com/vi/jhuzbKVCjuo/hqdefault.jpg", duration: "8:45", category: "YouTube Oficial" },
      { id: "yt4", title: "Banda Bruna - Mix Vikings 5 (Show En Vivo)", url: "https://www.youtube.com/watch?v=_94TmNOeKA4", embedId: "_94TmNOeKA4", thumbnail: "https://i.ytimg.com/vi/_94TmNOeKA4/hqdefault.jpg", duration: "7:15", category: "YouTube Oficial" }
    ],
    "facebook": [
      { id: "fb1", title: "Nuestra presentación y ritmo tropical en vivo 🎸 Banda Bruna BB", url: "https://www.facebook.com/reel/1020112310713480", thumbnail: "/assets/images/facebook/fb_reel_1.webp", duration: "0:45", category: "Facebook Reel" },
      { id: "fb2", title: "Comenta y comparte!! Esto es solo un adelanto de nuestro trabajo! 🎬 Banda Bruna BB", url: "https://www.facebook.com/reel/1703217417670134", thumbnail: "/assets/images/facebook/fb_reel_2.webp", duration: "0:30", category: "Facebook Reel" },
      { id: "fb3", title: "Breve adelanto de lo que viene: nuestro videoclip de Ahogado en un Bar! Tema 100% original 🍻", url: "https://www.facebook.com/reel/1322360210101084", thumbnail: "/assets/images/facebook/fb_reel_3.webp", duration: "1:00", category: "Facebook Reel" },
      { id: "fb4", title: "Banda Bruna en vivo haciendo bailar a todo el público sureño 💃🕺", url: "https://www.facebook.com/reel/1714825649530208", thumbnail: "/assets/images/facebook/fb_reel_4.webp", duration: "0:45", category: "Facebook Reel" },
      { id: "fb5", title: "Presentación en la comuna de Freire en el Día de la Madre ❤️ ¡Gracias por todo el cariño!", url: "https://www.facebook.com/reel/986876017068292", thumbnail: "/assets/images/facebook/fb_reel_5.webp", duration: "1:30", category: "Facebook Reel" }
    ],
    "tiktok": [
      { id: "tt1", title: "Show en vivo y producción de Banda Bruna 🎬 #productora", url: "https://www.tiktok.com/@bandabrunaoficial/video/7552604759543270667", thumbnail: "/assets/images/tiktok/tiktok_1.webp", duration: "1:00", category: "TikTok Oficial" },
      { id: "tt2", title: "Boroa Norte Toltén Chile 2024...!!! Banda Bruna BB...!! 🥁🔥", url: "https://www.tiktok.com/@bandabrunaoficial/video/7328464244482034949", thumbnail: "/assets/images/tiktok/tiktok_2.webp", duration: "1:15", category: "TikTok Oficial" },
      { id: "tt3", title: "Tributo a Antonio Ríos - El Maestro 🎶 #municipalidad #productora #cumbia", url: "https://www.tiktok.com/@bandabrunaoficial/video/7523401411820817669", thumbnail: "/assets/images/tiktok/tiktok_3.webp", duration: "0:45", category: "TikTok Oficial" },
      { id: "tt4", title: "Making Off, vídeo clip de Banda Bruna Muyyyyy... Prontito 📽️ #todos #destacame", url: "https://www.tiktok.com/@bandabrunaoficial/video/7651986871995600135", thumbnail: "/assets/images/tiktok/tiktok_4.webp", duration: "0:50", category: "TikTok Oficial" },
      { id: "tt5", title: "Detrás de cámaras: Grabación de nuestro nuevo videoclip oficial 🎬 #destacame #todos", url: "https://www.tiktok.com/@bandabrunaoficial/video/7651491620336061714", thumbnail: "/assets/images/tiktok/tiktok_5.webp", duration: "0:30", category: "TikTok Oficial" }
    ],
    "instagram": [
      { id: "ig1", title: "Próximamente en todas nuestras plataformas..!", url: "https://www.instagram.com/p/DZkqDn1uNpC/", thumbnail: "/assets/images/instagram/ig_reel_1.webp", duration: "1:00", category: "Instagram Reel" },
      { id: "ig2", title: "Hemos disfrutado de la tremenda presentación de @banda_bruna en nuestro Festival de la voz de Petorca.", url: "https://www.instagram.com/p/DGXG1nYse3g/", thumbnail: "/assets/images/instagram/ig_reel_2.webp", duration: "1:30", category: "Instagram Reel" },
      { id: "ig3", title: "Un pequeño resumen del proceso de grabación de nuestro siguiente videoclip...", url: "https://www.instagram.com/p/DZpvNd-uBjx/", thumbnail: "/assets/images/instagram/ig_reel_3.webp", duration: "0:45", category: "Instagram Reel" },
      { id: "ig4", title: "🎬✨ Próximamente... videoclip...", url: "https://www.instagram.com/p/DZlukv6MFPb/", thumbnail: "/assets/images/instagram/ig_reel_4.webp", duration: "1:15", category: "Instagram Reel" },
      { id: "ig5", title: "Los invitamos a ver este video de nuestra más reciente presentación en la comuna de Freire.", url: "https://www.instagram.com/p/DYQjaW4p6zw/", thumbnail: "/assets/images/instagram/ig_reel_5.webp", duration: "0:50", category: "Instagram Reel" }
    ]
  };
};

export const getInstagramFeed = () => {
  return [
    {
      id: "ig1",
      imageUrl: "/assets/images/instagram/lanzamiento_reel.webp",
      likes: 423,
      comments: 38,
      caption: `🎬✨ Próximamente...

Muy feliz y honrada de haber sido parte de este nuevo videoclip junto a @banda_bruna 📽 Gracias por la confianza y por permitirme formar parte de esta historia que pronto verá la luz.

Muy profesionales @agenciack.cl ✨️💋

Detrás de cada canción hay emociones, trabajo y momentos que merecen ser contados. Estoy ansiosa por ver el resultado final y compartirlo con ustedes🎶`,
      username: "@banda_bruna",
      timeAgo: "Reciente",
      link: "https://www.instagram.com/p/DZlukv6MFPb/"
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
      likes: 128,
      comments: 10,
      caption: "ultimo ensayo con transmisión en vivo para nuestra gente de todo Chile",
      timeAgo: "Hace 3 días",
      imageUrl: "/assets/images/instagram/tercera_publicacion.webp",
      link: "https://www.facebook.com/share/v/1FfDmrUWPP/"
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
      role: "Vocalista",
      image: "/assets/images/banda/cesar_bruna.webp",
      instagram: "https://www.instagram.com/bruna.cantante/",
      bio: "La voz y el carisma al frente de Banda Bruna, conectando al público con el alma y el ritmo de la cumbia sureña."
    },
    {
      name: "Jaime Cárdenas Sanhueza",
      role: "Percusión",
      image: "/assets/images/banda/jaime_sanhueza.webp",
      instagram: "https://www.instagram.com/jaime_cardenas_s/",
      bio: "El latido rítmico de la banda, dominando las congas y los bongos para encender la pista de baile."
    },
    {
      name: "Vicente Nuñez",
      role: "Guitarras & Dirección Musical",
      image: "/assets/images/banda/vicente_nunez.webp",
      instagram: "https://www.instagram.com/nunezenun_4/",
      bio: "Creador de las armonías y riffs de guitarra, guiando la dirección musical y la energía en el escenario."
    },
    {
      name: "Jaime Cárdenas Quilodrán",
      role: "Batería",
      image: "/assets/images/banda/jaime_quilodran.webp",
      instagram: "https://www.instagram.com/jaime.wavv/",
      bio: "El motor de la batería, asegurando la potencia y el tempo perfecto en cada presentación en vivo."
    },
    {
      name: "Gerson Ulloa",
      role: "Bajos",
      image: "/assets/images/banda/gerson_ulloa.webp",
      instagram: "https://www.instagram.com/geruson79/",
      bio: "El groove y la profundidad del bajo eléctrico que le da cuerpo a la propuesta tropical de la banda."
    },
    {
      name: "Fabián Garrido",
      role: "Güiros",
      image: "/assets/images/banda/fabian_garrido.webp",
      instagram: "https://www.instagram.com/fabian.gaes/",
      bio: "El brillo indispensable de la cumbia, aportando el sonido metálico del güiro y la percusión menor."
    },
    {
      name: "Israel Lagos",
      role: "Teclados",
      image: "/assets/images/banda/israel_lagos.webp",
      instagram: "https://www.instagram.com/andresromusic/",
      bio: "Teclados y sintetizadores que crean los ganchos melódicos y las secuencias de nuestro show."
    }
  ];
};
