export interface KartPalette {
  body: string;
  cockpit: string;
  wheel: string;
  stripe: string;
}

export const KART_PALETTES: KartPalette[] = [
  { body: '#e74c3c', cockpit: '#f1948a', wheel: '#2c3e50', stripe: '#f9e79f' },
  { body: '#3498db', cockpit: '#7fb3d3', wheel: '#2c3e50', stripe: '#f9e79f' },
  { body: '#2ecc71', cockpit: '#82e0aa', wheel: '#2c3e50', stripe: '#f9e79f' },
  { body: '#f39c12', cockpit: '#f8c471', wheel: '#2c3e50', stripe: '#f9e79f' },
];

export const TRACK_COLORS = {
  grass: '#4a7c59',
  grassDark: '#3d6b4b',
  road: '#555566',
  roadLine: '#e8e8c0',
  kerbRed: '#e74c3c',
  kerbWhite: '#f0f0f0',
  startLine: '#ffffff',
  shadow: 'rgba(0,0,0,0.3)',
  runOff: '#8a8070',
  tree: '#2a5c24',
  treeHighlight: '#3d8c33',
  treeShadow: 'rgba(0,0,0,0.20)',
};
