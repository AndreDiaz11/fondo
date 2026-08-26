export interface Paleta {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  accent: string;
  deposito: string;
  retiro: string;
  secundarioBg: string;
  secundarioText: string;
  peligroText: string;
}

export const paletaClara: Paleta = {
  background: '#eef5f2',
  card: '#ffffff',
  cardBorder: '#dbe7e2',
  text: '#18211f',
  textMuted: '#64716d',
  accent: '#0f766e',
  deposito: '#15803d',
  retiro: '#b91c1c',
  secundarioBg: '#e8efec',
  secundarioText: '#273530',
  peligroText: '#b91c1c',
};

export const paletaOscura: Paleta = {
  background: '#111917',
  card: '#18231f',
  cardBorder: '#243a35',
  text: '#edf7f4',
  textMuted: '#8fa39c',
  accent: '#0f766e',
  deposito: '#15803d',
  retiro: '#b91c1c',
  secundarioBg: '#263831',
  secundarioText: '#edf7f4',
  peligroText: '#f87171',
};

export function obtenerPaleta(theme: 'light' | 'dark'): Paleta {
  return theme === 'dark' ? paletaOscura : paletaClara;
}
