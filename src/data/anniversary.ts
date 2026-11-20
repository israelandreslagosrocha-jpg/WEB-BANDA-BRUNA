type Greeting = { name: string } & (
  | { youtubeId: string; videoUrl?: never }
  | { youtubeId?: never; videoUrl: string }
);

interface Update {
  title: string;
  published?: { date: string; label: string };
  description: string;
  instagramEmbedUrl?: string;
  link?: { url: string; label: string };
}

export const anniversary = {
  slug: 'fiesta-aniversario-banda-bruna',
  title: 'Fiesta Aniversario Banda Bruna',
  date: '2026-12-19',
  dateLabel: '19 de diciembre',
  timeZone: 'America/Santiago',
  countdownTo: '2026-12-19T00:00:00-03:00',
  photo: '/assets/images/hero/hero_1.webp',
  flyer: '',
  ticketUrl: 'https://www.passline.com/eventos/aniversario-banda-bruna',
  ticketLabel: 'COMPRA TUS ENTRADAS AQUÍ',
  greetings: [] as Greeting[],
  updates: [
    {
      title: 'Anuncio oficial de la Fiesta Aniversario',
      description: 'Banda Bruna anuncia su fiesta aniversario del 19 de diciembre.',
      instagramEmbedUrl: 'https://www.instagram.com/p/Df8Dm1FiXKF/embed/',
      link: {
        url: 'https://www.instagram.com/p/Df8Dm1FiXKF/?img_index=1',
        label: 'Ver publicación en Instagram',
      },
    },
  ] as Update[],
};
