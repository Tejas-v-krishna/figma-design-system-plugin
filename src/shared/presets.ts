// One-click brand starting points. Pure data + types, no Figma imports.
import type { RadiusPreset } from './types';

export interface BrandPreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primaryColor: string;
    informationColor: string;
    successColor: string;
    warningColor: string;
    errorColor: string;
    neutralColor: string;
  };
  fontFamily: { heading: string; body: string; mono: string };
  radiusPreset: RadiusPreset;
}

export const BRAND_PRESETS: BrandPreset[] = [
  {
    id: 'saas-blue',
    name: 'SaaS Blue',
    description: 'Trustworthy indigo primary with a balanced neutral ramp.',
    colors: {
      primaryColor: '#2563EB',
      informationColor: '#6366F1',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      errorColor: '#EF4444',
      neutralColor: '#64748B',
    },
    fontFamily: { heading: 'Google Sans', body: 'Google Sans', mono: 'Google Sans' },
    radiusPreset: 'rounded',
  },
  {
    id: 'warm',
    name: 'Warm',
    description: 'Energetic orange primary, earthy neutrals.',
    colors: {
      primaryColor: '#F97316',
      informationColor: '#F59E0B',
      successColor: '#16A34A',
      warningColor: '#EAB308',
      errorColor: '#DC2626',
      neutralColor: '#78716C',
    },
    fontFamily: { heading: 'Google Sans', body: 'Google Sans', mono: 'Google Sans' },
    radiusPreset: 'rounded',
  },
  {
    id: 'mono',
    name: 'Monochrome',
    description: 'Slate-on-slate for restrained, editorial systems.',
    colors: {
      primaryColor: '#334155',
      informationColor: '#475569',
      successColor: '#64748B',
      warningColor: '#94A3B8',
      errorColor: '#1E293B',
      neutralColor: '#64748B',
    },
    fontFamily: { heading: 'Google Sans', body: 'Google Sans', mono: 'Google Sans' },
    radiusPreset: 'sharp',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Green primary with a teal information accent.',
    colors: {
      primaryColor: '#16A34A',
      informationColor: '#0D9488',
      successColor: '#22C55E',
      warningColor: '#CA8A04',
      errorColor: '#B91C1C',
      neutralColor: '#57534E',
    },
    fontFamily: { heading: 'Google Sans', body: 'Google Sans', mono: 'Google Sans' },
    radiusPreset: 'rounded',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Punchy pink-to-purple brand for consumer apps.',
    colors: {
      primaryColor: '#DB2777',
      informationColor: '#9333EA',
      successColor: '#059669',
      warningColor: '#F59E0B',
      errorColor: '#E11D48',
      neutralColor: '#6B7280',
    },
    fontFamily: { heading: 'Google Sans', body: 'Google Sans', mono: 'Google Sans' },
    radiusPreset: 'pill',
  },
];
