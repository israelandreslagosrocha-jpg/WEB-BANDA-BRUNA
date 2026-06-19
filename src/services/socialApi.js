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
    thumbnail: "https://img.youtube.com/vi/p_zdcQEEOFY/maxresdefault.jpg",
    publishedAt: "Reciente"
  };
};

export const getVideoPlaylists = () => {
  return {
    "youtube": [
      { id: "yt1", title: "Banda Bruna - Luna Amiga (Videoclip Oficial)", url: "https://www.youtube.com/watch?v=R2_S1YfT9Jk", embedId: "R2_S1YfT9Jk", thumbnail: "https://img.youtube.com/vi/R2_S1YfT9Jk/maxresdefault.jpg", duration: "3:10", category: "YouTube Oficial" },
      { id: "yt2", title: "Banda Bruna - Agonía (Sesión En Vivo)", url: "https://www.youtube.com/watch?v=p_zdcQEEOFY", embedId: "p_zdcQEEOFY", thumbnail: "https://img.youtube.com/vi/p_zdcQEEOFY/maxresdefault.jpg", duration: "4:20", category: "YouTube Oficial" },
      { id: "yt3", title: "Banda Bruna - Mix Cumbias Clásicas (Sesión En Vivo)", url: "https://www.youtube.com/watch?v=R2_S1YfT9Jk", embedId: "R2_S1YfT9Jk", thumbnail: "https://img.youtube.com/vi/R2_S1YfT9Jk/maxresdefault.jpg", duration: "8:45", category: "YouTube Oficial" },
      { id: "yt4", title: "Banda Bruna - Mix Vikings 5 (Show En Vivo)", url: "https://www.youtube.com/watch?v=p_zdcQEEOFY", embedId: "p_zdcQEEOFY", thumbnail: "https://img.youtube.com/vi/p_zdcQEEOFY/maxresdefault.jpg", duration: "7:15", category: "YouTube Oficial" }
    ],
    "facebook": [
      { id: "fb1", title: "Presentación Destacada (Show en Vivo)", url: "https://www.facebook.com/reel/918184277458701", embedUrl: "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F918184277458701&show_text=0&width=560", duration: "Vivo", category: "Presentación" },
      { id: "fb2", title: "Ensayo y Ritmo Cumbianchero", url: "https://www.facebook.com/bandabruna/reels/", duration: "0:50", category: "Facebook Reel" },
      { id: "fb3", title: "Detrás de Cámaras: Villarrica Tour", url: "https://www.facebook.com/bandabruna/reels/", duration: "1:00", category: "Facebook Reel" },
      { id: "fb4", title: "La alegría del público sureño", url: "https://www.facebook.com/bandabruna/reels/", duration: "0:45", category: "Facebook Reel" }
    ]
  };
};

export const getInstagramFeed = () => {
  return [
    {
      id: "ig1",
      imageUrl: "assets/images/hero.png",
      likes: 342,
      comments: 24,
      caption: "¡Gracias Los Ángeles por una noche increíble! 🎸🔥 Nos vemos pronto en Villarrica. #BandaBruna #CumbiaSureña #Tour2026",
      username: "@banda.bruna",
      timeAgo: "Hace 1 día",
      link: "https://www.instagram.com/p/MOCK_IG_1"
    },
    {
      id: "ig2",
      imageUrl: "assets/images/album.png",
      likes: 512,
      comments: 31,
      caption: "Así se vivió el fin de semana en Villarrica! 🎸🔥 Seguimos con todo el sabor. Próxima parada: Temuco Beer Festival.",
      username: "@banda.bruna",
      timeAgo: "Hace 2 días",
      link: "https://www.instagram.com/p/MOCK_IG_2"
    },
    {
      id: "ig3",
      imageUrl: "assets/images/hero.png",
      likes: 287,
      comments: 18,
      caption: "Listos para lo que se viene este 2026! 🔥 Grabando nuevo material en estudio y preparando sorpresas para todos.",
      username: "@banda.bruna",
      timeAgo: "Hace 4 días",
      link: "https://www.instagram.com/p/MOCK_IG_3"
    }
  ];
};

export const getFacebookFeed = () => {
  return [
    {
      id: "fb1",
      likes: 128,
      comments: 10,
      caption: "Próximo destino: Festival de la Cerveza Temuco 🍺👏 ¡No te lo pierdas, entrada liberada! Nos vemos en el escenario principal.",
      timeAgo: "Hace 3 días",
      link: "https://facebook.com/bandabruna/posts/1"
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
  return [
    {
      id: "e1",
      date: "24",
      month: "MAY",
      year: "2026",
      fullDate: "2026-05-24",
      title: "FIESTA COSTUMBRISTA",
      location: "Los Ángeles, Biobío",
      venue: "Recinto Ferial Los Ángeles",
      status: "Confirmado",
      statusType: "confirmed", // confirmed, pending
      mapUrl: "https://maps.google.com/?q=Recinto+Ferial+Los+Angeles",
      time: "21:00"
    },
    {
      id: "e2",
      date: "31",
      month: "MAY",
      year: "2026",
      fullDate: "2026-05-31",
      title: "FESTIVAL DE LA CERVEZA",
      location: "Temuco, La Araucanía",
      venue: "Parque Estadio Germán Becker",
      status: "Confirmado",
      statusType: "confirmed",
      mapUrl: "https://maps.google.com/?q=Estadio+German+Becker+Temuco",
      time: "22:30"
    },
    {
      id: "e3",
      date: "08",
      month: "JUN",
      year: "2026",
      fullDate: "2026-06-08",
      title: "EVENTO PRIVADO",
      location: "Pucón, La Araucanía",
      venue: "Gran Hotel Pucón",
      status: "Confirmado",
      statusType: "confirmed",
      mapUrl: "https://maps.google.com/?q=Gran+Hotel+Pucon",
      time: "20:00"
    },
    {
      id: "e4",
      date: "15",
      month: "JUN",
      year: "2026",
      fullDate: "2026-06-15",
      title: "FIESTA PATRONAL",
      location: "Valdivia, Los Ríos",
      venue: "Gimnasio Municipal Valdivia",
      status: "Confirmado",
      statusType: "confirmed",
      mapUrl: "https://maps.google.com/?q=Gimnasio+Municipal+Valdivia",
      time: "21:30"
    },
    {
      id: "e5",
      date: "22",
      month: "JUN",
      year: "2026",
      fullDate: "2026-06-22",
      title: "MUNICIPALIDAD DE VILLARRICA",
      location: "Villarrica, La Araucanía",
      venue: "Costanera de Villarrica",
      status: "Por Confirmar",
      statusType: "pending",
      mapUrl: "https://maps.google.com/?q=Costanera+Villarrica",
      time: "20:30"
    }
  ];
};

export const getNews = () => {
  return [
    {
      id: "news1",
      title: "Banda Bruna será la orquesta oficial del Festival de la Cerveza 2025",
      summary: "La organización del evento confirmó a Banda Bruna en el horario estelar del sábado para encender el Parque Germán Becker.",
      publishedAt: "Hace 5 días",
      category: "Eventos"
    },
    {
      id: "news2",
      title: "Grabación de videoclip oficial 'A Fuego Lento' finaliza con éxito",
      summary: "El equipo de producción audiovisual completó el rodaje en locaciones de Temuco y alrededores. Lanzamiento programado para este mes.",
      publishedAt: "Hace 10 días",
      category: "Lanzamientos"
    }
  ];
};

export const getSpotifyAlbum = () => {
  return {
    artistId: "3QpgBBp8CypsMEM5rgWo7D",
    albumName: "Elysian Echoes",
    spotifyEmbedUrl: "https://open.spotify.com/embed/artist/3QpgBBp8CypsMEM5rgWo7D?utm_source=generator&theme=0",
    topTracks: [
      { id: "s1", title: "A Fuego Lento", playCount: "128,450", duration: "3:45" },
      { id: "s2", title: "Cumbia del Amor", playCount: "94,120", duration: "4:12" },
      { id: "s3", title: "Nocturno Sureño", playCount: "73,890", duration: "3:30" }
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
