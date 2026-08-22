import { create } from 'zustand';
import {
  GenerationConfig,
  GenerationStats,
  UsageReport,
  DEFAULT_CONFIG,
} from '../shared/types';
import { COMPONENT_DEFINITIONS } from '../shared/component-definitions';
import { BRAND_PRESETS, BrandPreset } from '../shared/presets';
import { postToPlugin } from './plugin';

export type View = 'set-tokens' | 'build-components' | 'code' | 'brand' | 'typography' | 'components' | 'review' | 'export' | 'scan';
export type TokenCategory = 'colors' | 'gradients' | 'typography' | 'spacing' | 'radius' | 'stroke' | 'effects';
export type Overlay = 'none' | 'generating' | 'success';
export type ExportFormat = 'json' | 'css' | 'tailwind' | 'dtcg';

export const CATEGORY_LABELS: Record<string, string> = {
  buttons: 'Buttons',
  inputs: 'Inputs',
  forms: 'Forms',
  cards: 'Cards',
  feedback: 'Feedback',
  navigation: 'Navigation',
  'data-display': 'Data Display',
  overlays: 'Overlays',
  media: 'Media',
  typography: 'Typography',
};

export interface CategoryGroup {
  category: string;
  label: string;
  components: string[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = (() => {
  const map = new Map<string, string[]>();
  for (const def of COMPONENT_DEFINITIONS) {
    if (!map.has(def.category)) map.set(def.category, []);
    map.get(def.category)!.push(def.name);
  }
  return [...map.entries()].map(([category, components]) => ({
    category,
    label: CATEGORY_LABELS[category] ?? category,
    components,
  }));
})();

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export interface RadiusItem {
  id: string;
  label: string;
  value: number;
}

export interface StrokeItem {
  id: string;
  label: string;
  value: number;
}

export interface ShadowItem {
  id: string;
  label: string;
  value: string;
  type: string;
}

export interface CustomColorGroup {
  id: string;
  name: string;
  hex: string;
}

interface UIState {
  view: View;
  tokenCategory: TokenCategory;
  componentSearch: string;
  overlay: Overlay;
  optionsOpen: boolean;
  importOpen: boolean;
  lastError: string | null;

  // Custom token overrides, editable per row in the token panels
  radiusList: RadiusItem[];
  strokeList: StrokeItem[];
  effectsList: ShadowItem[];
  customColorGroups: CustomColorGroup[];

  config: GenerationConfig;
  progress: number;
  progressMessage: string;
  statusMessage: string;
  success: boolean;
  stats: GenerationStats | null;

  exportFormat: ExportFormat;
  exportResult: string | null;
  exportError: string | null;
  exportBusy: boolean;

  availableFonts: string[] | null;

  scanResult: UsageReport | null;
  scanError: string | null;
  scanBusy: boolean;

  setView: (v: View) => void;
  setTokenCategory: (c: TokenCategory) => void;
  setComponentSearch: (q: string) => void;
  setOverlay: (o: Overlay) => void;
  setOptionsOpen: (b: boolean) => void;
  setImportOpen: (b: boolean) => void;
  clearError: () => void;

  updateRadiusItem: (id: string, value: number) => void;
  addRadiusItem: () => void;
  updateStrokeItem: (id: string, value: number) => void;
  addStrokeItem: () => void;
  updateEffectItem: (id: string, label: string) => void;
  addCustomColorGroup: (name: string, hex: string) => void;

  updateConfig: (patch: Partial<GenerationConfig>) => void;
  updateOptions: (patch: Partial<GenerationConfig['options']>) => void;
  updateFont: (which: 'heading' | 'body' | 'mono', value: string) => void;
  toggleCategory: (category: string, on: boolean) => void;
  toggleComponent: (name: string, on: boolean) => void;
  selectAll: (on: boolean) => void;
  applyPreset: (preset: BrandPreset) => void;
  importPalette: (patch: Partial<GenerationConfig>) => void;
  hydrateConfig: (saved: Partial<GenerationConfig>) => void;
  persist: () => void;
  loadPersisted: () => void;

  setExportFormat: (f: ExportFormat) => void;
  setProgress: (p: number, m: string) => void;
  generationComplete: (success: boolean, message: string, stats: GenerationStats | null) => void;
  exportComplete: (success: boolean, result: string | null, message?: string) => void;
  scanComplete: (success: boolean, report: UsageReport | null, message?: string) => void;
  setAvailableFonts: (fonts: string[]) => void;

  selectedColor: { hex: string; name: string } | null;
  setSelectedColor: (hex: string, name?: string) => void;
  generateColorExtensions: (hex?: string, name?: string, customStops?: Record<string, string[]>) => void;

  startGeneration: (target?: string) => void;
  requestExport: (format: ExportFormat) => void;
  requestScan: () => void;
}

export const useStore = create<UIState>((set, get) => ({
  view: 'set-tokens',
  tokenCategory: 'radius',
  componentSearch: '',
  overlay: 'none',
  optionsOpen: false,
  importOpen: false,
  lastError: null,

  radiusList: [
    { id: 'none', label: 'none', value: 0 },
    { id: '1', label: '1', value: 2 },
    { id: '2', label: '2', value: 4 },
    { id: '3', label: '3', value: 6 },
    { id: '4', label: '4', value: 8 },
    { id: '5', label: '5', value: 10 },
    { id: '6', label: '6', value: 12 },
    { id: '7', label: '7', value: 16 },
  ],
  strokeList: [
    { id: '0', label: '0', value: 1 },
    { id: '1', label: '1', value: 2 },
    { id: '2', label: '2', value: 4 },
    { id: '3', label: '3', value: 6 },
  ],
  effectsList: [
    { id: 'E0', label: 'E0', value: 'Drop Shadow', type: 'Drop Shadow' },
    { id: 'E1', label: 'E1', value: 'Drop Shadow, In...', type: 'Drop Shadow' },
    { id: 'E2', label: 'E2', value: 'Drop Shadow, In...', type: 'Drop Shadow' },
    { id: 'E3', label: 'E3', value: 'Drop Shadow, In...', type: 'Drop Shadow' },
  ],
  customColorGroups: [
    { id: 'red', name: 'Red', hex: '#EF4444' },
    { id: 'yellow', name: 'Yellow', hex: '#F59E0B' },
    { id: 'green', name: 'Green', hex: '#10B981' },
  ],

  config: clone(DEFAULT_CONFIG),
  progress: 0,
  progressMessage: '',
  statusMessage: '',
  success: false,
  stats: null,

  exportFormat: 'json',
  exportResult: null,
  exportError: null,
  exportBusy: false,

  availableFonts: null,

  selectedColor: { hex: '#2563EB', name: 'Primary' },

  scanResult: null,
  scanError: null,
  scanBusy: false,

  setView: (v) => set({ view: v, lastError: null }),
  setTokenCategory: (c) => set({ tokenCategory: c }),
  setSelectedColor: (hex, name) => set({ selectedColor: { hex, name: name || hex } }),
  generateColorExtensions: (hex, name) => {
    const targetHex = hex || get().selectedColor?.hex || get().config.primaryColor;
    const targetName = name || get().selectedColor?.name || 'Color';
    set({ overlay: 'generating', progress: 0, progressMessage: 'Generating Shades & Gradients…', statusMessage: '', lastError: null });
    postToPlugin({
      type: 'GENERATE_COLOR_EXTENSIONS',
      payload: { hex: targetHex, name: targetName, config: get().config },
    });
  },

  setComponentSearch: (q) => set({ componentSearch: q }),
  setOverlay: (o) => set({ overlay: o }),
  setOptionsOpen: (b) => set({ optionsOpen: b }),
  setImportOpen: (b) => set({ importOpen: b }),
  // Dismissing the banner has to clear the feature-level errors too, otherwise
  // the next exportComplete/scanComplete would leave stale state behind.
  clearError: () => set({ lastError: null, exportError: null, scanError: null }),

  updateRadiusItem: (id, value) =>
    set((s) => ({
      radiusList: s.radiusList.map((item) => (item.id === id ? { ...item, value } : item)),
    })),
  addRadiusItem: () =>
    set((s) => {
      const newId = String(s.radiusList.length);
      const lastVal = s.radiusList[s.radiusList.length - 1]?.value ?? 0;
      return {
        radiusList: [...s.radiusList, { id: newId, label: newId, value: lastVal + 4 }],
      };
    }),
  updateStrokeItem: (id, value) =>
    set((s) => ({
      strokeList: s.strokeList.map((item) => (item.id === id ? { ...item, value } : item)),
    })),
  addStrokeItem: () =>
    set((s) => {
      const newId = String(s.strokeList.length);
      const lastVal = s.strokeList[s.strokeList.length - 1]?.value ?? 1;
      return {
        strokeList: [...s.strokeList, { id: newId, label: newId, value: lastVal + 2 }],
      };
    }),
  updateEffectItem: (id, label) =>
    set((s) => ({
      effectsList: s.effectsList.map((item) => (item.id === id ? { ...item, label, value: label } : item)),
    })),
  addCustomColorGroup: (name, hex) =>
    set((s) => ({
      customColorGroups: [
        ...s.customColorGroups,
        { id: name.toLowerCase().replace(/\s+/g, '-'), name, hex },
      ],
    })),

  updateConfig: (patch) => {
    set((s) => ({ config: { ...s.config, ...patch } }));
    get().persist();
  },
  updateOptions: (patch) => {
    set((s) => ({ config: { ...s.config, options: { ...s.config.options, ...patch } } }));
    get().persist();
  },
  updateFont: (which, value) => {
    set((s) => ({ config: { ...s.config, fontFamily: { ...s.config.fontFamily, [which]: value } } }));
    get().persist();
  },
  toggleCategory: (category, on) => {
    set((s) => {
      const group = CATEGORY_GROUPS.find((g) => g.category === category);
      if (!group) return {};
      const current = new Set(s.config.componentsToGenerate);
      if (on) group.components.forEach((c) => current.add(c));
      else group.components.forEach((c) => current.delete(c));
      return { config: { ...s.config, componentsToGenerate: [...current] } };
    });
    get().persist();
  },
  toggleComponent: (name, on) => {
    set((s) => {
      const current = new Set(s.config.componentsToGenerate);
      if (on) current.add(name);
      else current.delete(name);
      return { config: { ...s.config, componentsToGenerate: [...current] } };
    });
    get().persist();
  },
  selectAll: (on) => {
    set((s) => ({
      config: { ...s.config, componentsToGenerate: on ? COMPONENT_DEFINITIONS.map((c) => c.name) : [] },
    }));
    get().persist();
  },
  applyPreset: (preset) => {
    set((s) => ({
      config: {
        ...s.config,
        primaryColor: preset.colors.primaryColor,
        informationColor: preset.colors.informationColor,
        successColor: preset.colors.successColor,
        warningColor: preset.colors.warningColor,
        errorColor: preset.colors.errorColor,
        neutralColor: preset.colors.neutralColor,
        fontFamily: { ...preset.fontFamily },
        radiusPreset: preset.radiusPreset,
      },
    }));
    get().persist();
  },
  importPalette: (patch) => {
    set((s) => ({ config: { ...s.config, ...patch }, importOpen: false, view: 'brand' }));
    get().persist();
  },
  hydrateConfig: (saved) => {
    set({
      config: {
        ...clone(DEFAULT_CONFIG),
        ...saved,
        fontFamily: { ...clone(DEFAULT_CONFIG).fontFamily, ...(saved.fontFamily ?? {}) },
        options: { ...clone(DEFAULT_CONFIG).options, ...(saved.options ?? {}) },
        componentsToGenerate: saved.componentsToGenerate ?? [],
      },
    });
  },
  persist: () => postToPlugin({ type: 'SAVE_CONFIG', payload: get().config }),
  loadPersisted: () => postToPlugin({ type: 'LOAD_CONFIG' }),

  setExportFormat: (f) => set({ exportFormat: f, exportResult: null, exportError: null }),
  setProgress: (p, m) => set({ progress: p, progressMessage: m }),

  generationComplete: (success, message, stats) =>
    set({
      success,
      statusMessage: message,
      stats,
      overlay: success ? 'success' : 'none',
      lastError: success ? null : message,
      progress: success ? 100 : 0,
    }),

  // Export and scan failures also raise lastError so App's banner shows them.
  // Without this the only feedback for a failed export was the button leaving
  // its busy state — exportError was set and never rendered anywhere.
  exportComplete: (success, result, message) =>
    set({
      exportBusy: false,
      exportResult: success ? result : null,
      exportError: success ? null : message ?? 'Export failed',
      lastError: success ? null : message ?? 'Export failed',
    }),

  scanComplete: (success, report, message) =>
    set({
      scanBusy: false,
      scanResult: success ? report : null,
      scanError: success ? null : message ?? 'Scan failed',
      lastError: success ? null : message ?? 'Scan failed',
    }),

  setAvailableFonts: (fonts) => set({ availableFonts: fonts }),

  startGeneration: (target?: any) => {
    set({ overlay: 'generating', progress: 0, progressMessage: 'Starting…', statusMessage: '', lastError: null });
    const targetMode = typeof target === 'string' ? target : (get().view === 'build-components' ? 'components' : get().tokenCategory);
    postToPlugin({ type: 'GENERATE_DESIGN_SYSTEM', payload: { ...get().config, target: targetMode } });
  },
  requestExport: (format) => {
    set({ exportBusy: true, exportResult: null, exportError: null });
    // Send the config too: the plugin sandbox loses its token cache on every
    // reopen, and tokens are derivable from config, so this makes export work
    // without forcing a generate first.
    postToPlugin({ type: 'EXPORT_TOKENS', payload: { format, config: get().config } });
  },
  requestScan: () => {
    set({ scanBusy: true, scanResult: null, scanError: null });
    postToPlugin({ type: 'SCAN_USAGE' });
  },
}));

export { BRAND_PRESETS };
