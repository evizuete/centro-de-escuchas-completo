export interface ScoreColors {
  fg: string;
  bg: string;
  border: string;
}

export function scoreColor(v: number): ScoreColors {
  if (v >= 85) return { fg: '#15803d', bg: '#dcfce7', border: '#86efac' };
  if (v >= 70) return { fg: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' };
  if (v >= 55) return { fg: '#b45309', bg: '#fef3c7', border: '#fcd34d' };
  return { fg: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' };
}

export function sentimentColor(sent: string): string {
  if (sent.toLowerCase().includes('neg')) return '#dc2626';
  if (sent === 'Neutro') return '#64748b';
  return '#15803d';
}

/** Devuelve segundos a partir de una cadena "mm:ss". */
export function tToSec(t: string): number {
  const [m, s] = t.split(':').map(Number);
  return (m || 0) * 60 + (s || 0);
}

/** Formatea segundos a "mm:ss". */
export function fmtSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
