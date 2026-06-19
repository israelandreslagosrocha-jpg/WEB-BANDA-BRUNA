// Mock Social API Service for Banda Bruna 2.0
// This module simulates dynamic content from YouTube, Instagram, Facebook, Spotify, and a local CMS.
// In the future, this can be connected to real endpoints by updating these functions.

export const getLatestVideo = () => {
  return {
    id: "a-fuego-lento",
    title: "A FUEGO LENTO",
    type: "Videoclip Oficial",
    youtubeUrl: "https://www.youtube.com/watch?v=F_YOUTUBE_MOCK_1",
    embedUrl: "https://www.youtube.com/embed/F_YOUTUBE_MOCK_1?autoplay=1&mute=1&loop=1&playlist=F_YOUTUBE_MOCK_1&controls=0&showinfo=0&rel=0&modestbranding=1",
    thumbnail: "assets/images/album.png",
    publishedAt: "Hace 3 días"
  };
};

export const getVideoPlaylists = () => {
  return {
    "videoclips": [
      { id: "v1", title: "A Fuego Lento", url: "https://www.youtube.com/watch?v=1", duration: "3:45", category: "Videoclips Oficiales" },
      { id: "v2", title: "Cumbia del Amor", url: "https://www.youtube.com/watch?v=2", duration: "4:12", category: "Videoclips Oficiales" },
      { id: "v3", title: "Nocturno Sureño", url: "https://www.youtube.com/watch?v=3", duration: "3:30", category: "Videoclips Oficiales" }
    ],
    "envivo": [
      { id: "l1", title: "Presentación en Vivo - Festival de la Cerveza Temuco 2025", url: "https://www.youtube.com/watch?v=4", duration: "25:40", category: "En Vivo" },
      { id: "l2", title: "Show Completo - Club Subterráneo Santiago", url: "https://www.youtube.com/watch?v=5", duration: "45:15", category: "En Vivo" }
    ],
    "backstage": [
      { id: "b1", title: "Detrás de Cámaras: Grabación de 'A Fuego Lento'", url: "https://www.youtube.com/watch?v=6", duration: "5:22", category: "Backstage" },
      { id: "b2", title: "Gira Sureña 2025 - Diario de Viaje", url: "https://www.youtube.com/watch?v=7", duration: "12:10", category: "Backstage" }
    ],
    "promocionales": [
      { id: "p1", title: "Teaser Oficial Album 2026", url: "https://www.youtube.com/watch?v=8", duration: "1:00", category: "Promocionales" }
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
    { name: "Bruna", role: "Voz Principal & Sintetizadores", bio: "Líder vocal y fundadora de la banda, combinando raíces melódicas sureñas con ritmos alternativos." },
    { name: "Israel", role: "Guitarra & Coros", bio: "Creador de los riffs y acordes distintivos que definen la cumbia sureña alternativa." },
    { name: "Andrés", role: "Bajo", bio: "Base rítmica sólida de la banda, aportando el groove bailable en cada presentación." },
    { name: "Rocha", role: "Batería & Percusión", bio: "El motor de los espectáculos en vivo, manejando dinámicas desde percusiones tradicionales hasta electrónicas." }
  ];
};
