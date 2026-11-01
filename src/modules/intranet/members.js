export const members = [
  ['gersonulloa@bandabruna.cl', 'Gerson Ulloa', 'miembro'],
  ['jaimecardenas@bandabruna.cl', 'Jaime Cárdenas', 'jefatura'],
  ['jaimecardenasjr@bandabruna.cl', 'Jaime Cárdenas Jr.', 'miembro'],
  ['vicentenunez@bandabruna.cl', 'Vicente Núñez', 'director'],
  ['israellagos@bandabruna.cl', 'Israel Lagos', 'miembro'],
  ['fabiangarrido@bandabruna.cl', 'Fabián Garrido', 'miembro'],
  ['cesarbruna@bandabruna.cl', 'César Bruna', 'jefatura'],
];
export function memberFor(email) { return members.find(m => m[0] === email?.toLowerCase()); }
