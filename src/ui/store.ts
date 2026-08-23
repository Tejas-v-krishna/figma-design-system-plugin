import { create } from 'zustand';
import {
  GenerationConfig,
  GenerationStats,
  UsageReport,
  DEFAULT_CONFIG,
} from '../shared/types';
import { COMPONENT_DEFINITIONS } from '../shared/component-definitions';
import { BRAND_PRESETS, BrandPreset } from '../shared/presets';
import { postToPlugin, ExistingSummary } from './plugin';

// Exactly the four panels the header offers, and nothing else. There used to be
// four more members — 'brand', 'typography', 'components' and 'export' — that
// App routed to one of these four anyway, plus a 'review' that routed nowhere
// and rendered an empty main area. They were kept on the theory that persisted
// state might still hold one, but `persist` only ever saves `config`, so a view
// name has never survived a reload.
export type View = 'set-tokens' | 'build-components' | 'code' | 'scan';
export type TokenCategory = 'colors' | 'gradients' | 'typography' | 'spacing' | 'radius' | 'stroke' | 'effects' | 'motion';
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
  /**
   * Non-fatal notices worth showing once: config fields the sandbox had to
   * repair on load, mainly. Separate from lastError because nothing failed —
   * the run succeeded with a substitution the user should know about.
   */
  warnings: string[];

  customColorGroups: CustomColorGroup[];

  config: GenerationConfig;
  progress: number;
  progressMessage: string;
  statusMessage: string;
  success: boolean;
  stats: GenerationStats | null;

  exportFormat: ExportFormat;
  exportResult: string | null;
  exportBusy: boolean;

  availableFonts: string[] | null;

  scanResult: UsageReport | null;
  scanBusy: boolean;
  /** 0–100 while a scan runs. A large file takes seconds, so this is not decorative. */
  scanProgress: number;
  scanMessage: string;

  setView: (v: View) => void;
  setTokenCategory: (c: TokenCategory) => void;
  setComponentSearch: (q: string) => void;
  setOverlay: (o: Overlay) => void;
  setOptionsOpen: (b: boolean) => void;
  setImportOpen: (b: boolean) => void;
  clearError: () => void;
  /** Surface a sandbox-side crash the UI had no other way to learn about. */
  reportPluginError: (message: string) => void;
  setWarnings: (warnings: string[]) => void;
  clearWarnings: () => void;
  setScanProgress: (progress: number, message: string) => void;

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
  /** Non-null while an overwrite confirmation is on screen. */
  existingSummary: ExistingSummary | null;
  /**
   * True between pressing Generate and the sandbox answering the overwrite
   * check. That check runs loadAllPagesAsync plus three style queries, which on
   * a large file is well over the 500ms where an action needs to say it is
   * working — and until it answers, nothing at all had happened on screen.
   */
  checkingExisting: boolean;
  /** The target the user asked for, held across the overwrite round trip. */
  pendingTarget: string | null;
  confirmGeneration: () => void;
  cancelGeneration: () => void;
  existingChecked: (summary: ExistingSummary) => void;
  requestExport: (format: ExportFormat) => void;
  requestScan: () => void;
}

/**
 * True while a Generate press is still waiting on something — the sandbox's
 * overwrite check, or the confirmation dialog that check raised.
 *
 * Both footers and the success overlay read this rather than checking one flag
 * each, because a button that started the wait must not look pressable for
 * either half of it. The confirmation's backdrop happens to swallow the click,
 * but "blocked by an invisible layer" is not the same as "shown as unavailable".
 */
export const isGenerateBusy = (s: UIState): boolean =>
  s.checkingExisting || s.existingSummary !== null;

export const useStore = create<UIState>((set, get) => ({
  view: 'set-tokens',
  tokenCategory: 'radius',
  componentSearch: '',
  overlay: 'none',
  optionsOpen: false,
  importOpen: false,
  lastError: null,
  warnings: [],

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
  exportBusy: false,

  availableFonts: null,

  selectedColor: { hex: '#2563EB', name: 'Primary' },

  scanResult: null,
  scanBusy: false,
  scanProgress: 0,
  scanMessage: '',

  existingSummary: null,
  checkingExisting: false,
  pendingTarget: null,

  setView: (v) => set({ view: v, lastError: null }),
  setTokenCategory: (c) => set({ tokenCategory: c }),
  setSelectedColor: (hex, name) => set({ selectedColor: { hex, name: name || hex } }),
  generateColorExtensions: (hex, name, customStops) => {
    const targetHex = hex || get().selectedColor?.hex || get().config.primaryColor;
    const targetName = name || get().selectedColor?.name || 'Color';
    set({ overlay: 'generating', progress: 0, progressMessage: 'Generating Shades & Gradients…', statusMessage: '', lastError: null });
    postToPlugin({
      type: 'GENERATE_COLOR_EXTENSIONS',
      // customStops carries the gradient stops the user hand-edited in the
      // Gradients panel. The parameter was declared, both call sites passed it and
      // the sandbox parsed it — this function was the one link that dropped it, so
      // every edited stop was silently discarded and the board came back with the
      // derived colours instead.
      payload: { hex: targetHex, name: targetName, config: get().config, customStops },
    });
  },

  setComponentSearch: (q) => set({ componentSearch: q }),
  setOverlay: (o) => set({ overlay: o }),
  setOptionsOpen: (b) => set({ optionsOpen: b }),
  setImportOpen: (b) => set({ importOpen: b }),
  // Dismissing the banner has to clear the feature-level errors too, otherwise
  // the next exportComplete/scanComplete would leave stale state behind.
  clearError: () => set({ lastError: null }),

  // A crash inside the sandbox used to reach a `switch` in App with no case for
  // it, so the panel sat on whatever it was showing — spinner included — with no
  // indication anything had gone wrong. Clearing the overlay matters as much as
  // showing the text: an error while an overlay is up would otherwise trap the
  // user behind a progress bar that has stopped moving.
  reportPluginError: (message) =>
    set({
      lastError: message,
      overlay: 'none',
      exportBusy: false,
      scanBusy: false,
      progress: 0,
    }),

  setWarnings: (warnings) => set({ warnings }),
  clearWarnings: () => set({ warnings: [] }),
  setScanProgress: (progress, message) => set({ scanProgress: progress, scanMessage: message }),


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
    // Lands on the Colors panel, not just on Set Tokens. The view alone left the
    // token category wherever it was, so importing a palette while Radius was
    // open closed the dialog onto a list of corner radii — nothing on screen had
    // changed, and the only way to see the imported colours was to go looking.
    set((s) => ({
      config: { ...s.config, ...patch },
      importOpen: false,
      view: 'set-tokens',
      tokenCategory: 'colors',
    }));
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

  setExportFormat: (f) => set({ exportFormat: f, exportResult: null }),
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

  // Export and scan failures raise lastError so App's banner shows them. Before
  // that, the only feedback for a failed export was the button leaving its busy
  // state: the message went into an exportError field nothing rendered.
  //
  // Neither clears lastError on success: requestExport and requestScan do that
  // when they start, which is the moment a previous failure stops being true.
  exportComplete: (success, result, message) =>
    set({
      exportBusy: false,
      exportResult: success ? result : null,
      ...(success ? {} : { lastError: message ?? 'Export failed' }),
    }),

  scanComplete: (success, report, message) =>
    set({
      scanBusy: false,
      scanResult: success ? report : null,
      ...(success ? {} : { lastError: message ?? 'Scan failed' }),
    }),

  setAvailableFonts: (fonts) => set({ availableFonts: fonts }),

  // `target` is typed by the interface as `string | undefined`. The
  // implementation used to re-declare it as `any` and then test
  // `typeof target === 'string'`, which looked like a guard against a click
  // handler passing a MouseEvent — but no call site does that; they all pass a
  // category name or nothing. So the check tested a case that could not occur,
  // and the `any` disabled type checking on the one argument that matters.
  //
  // Generating overwrites same-named styles and reuses the generator's pages, so
  // this no longer fires the request directly. It asks the sandbox what is
  // already there and waits; App resolves the answer into either an immediate
  // run (nothing to overwrite) or a confirmation dialog.
  startGeneration: (target) => {
    // A second press while the first check is in flight would post a second
    // CHECK_EXISTING, and the first reply already consumes pendingTarget — so the
    // second reply would arrive with nothing to do and the run would look lost.
    // The same applies once the confirmation is up: that press is still pending
    // an answer from the user, it just isn't waiting on the sandbox any more.
    if (isGenerateBusy(get())) return;
    const resolved = target ?? (get().view === 'build-components' ? 'components' : get().tokenCategory);
    set({ pendingTarget: resolved, lastError: null, checkingExisting: true });
    startCheckWatchdog();
    postToPlugin({ type: 'CHECK_EXISTING' });
  },

  /** Run for real. Called once the user has confirmed, or when there was nothing to confirm. */
  confirmGeneration: () => {
    const target = get().pendingTarget;
    clearCheckWatchdog();
    set({
      overlay: 'generating',
      progress: 0,
      progressMessage: 'Starting…',
      statusMessage: '',
      lastError: null,
      existingSummary: null,
      pendingTarget: null,
      checkingExisting: false,
    });
    postToPlugin({
      type: 'GENERATE_DESIGN_SYSTEM',
      payload: { ...get().config, target: target ?? 'all' },
    });
  },

  cancelGeneration: () => {
    clearCheckWatchdog();
    set({ existingSummary: null, pendingTarget: null, checkingExisting: false });
  },

  /**
   * The sandbox answered the overwrite check.
   *
   * Nothing there means nothing to confirm, so run straight away — a
   * confirmation dialog on an empty document would be a pointless extra click
   * on the plugin's single most common action.
   */
  existingChecked: (summary) => {
    if (get().pendingTarget === null) return;
    clearCheckWatchdog();
    if (!summary.hasAny) {
      // confirmGeneration clears checkingExisting on its way into 'generating',
      // so the button hands its busy state straight over to the progress overlay
      // instead of flickering back to idle in between.
      get().confirmGeneration();
      return;
    }
    set({ existingSummary: summary, checkingExisting: false });
  },
  requestExport: (format) => {
    // lastError is cleared here, at the start, rather than on the success path
    // of exportComplete. Pressing the button is what makes a previous failure of
    // this action moot; a *success* arriving later says nothing about an error
    // raised by some other action, and clearing it there wiped messages the user
    // had not read yet.
    set({ exportBusy: true, exportResult: null, lastError: null });
    // Send the config too: the plugin sandbox loses its token cache on every
    // reopen, and tokens are derivable from config, so this makes export work
    // without forcing a generate first.
    postToPlugin({ type: 'EXPORT_TOKENS', payload: { format, config: get().config } });
  },
  requestScan: () => {
    set({
      scanBusy: true,
      scanResult: null,
      lastError: null,
      scanProgress: 0,
      scanMessage: 'Starting scan…',
    });
    postToPlugin({ type: 'SCAN_USAGE' });
  },
}));

/**
 * Failsafe for the overwrite check.
 *
 * The sandbox answers CHECK_EXISTING on both its success and its failure path,
 * so under normal conditions this timer is always cleared before it fires. It is
 * here for the case where no answer arrives at all — the sandbox being torn down
 * mid-check, or the message channel dropping — because without it the Generate
 * button would stay in its busy state for the rest of the session with no way
 * back and nothing on screen explaining why.
 *
 * The window is deliberately generous: loadAllPagesAsync on a large file is
 * genuinely slow, and a watchdog that fires while real work is still running
 * would be a worse bug than the one it guards against.
 */
const CHECK_TIMEOUT_MS = 30000;
let checkWatchdog: ReturnType<typeof setTimeout> | null = null;

function startCheckWatchdog(): void {
  clearCheckWatchdog();
  checkWatchdog = setTimeout(() => {
    checkWatchdog = null;
    if (!useStore.getState().checkingExisting) return;
    useStore.setState({
      checkingExisting: false,
      pendingTarget: null,
      lastError:
        'Figma did not respond while checking what is already in this file. Nothing was changed — try again, and if it keeps happening close and reopen the plugin.',
    });
  }, CHECK_TIMEOUT_MS);
}

function clearCheckWatchdog(): void {
  if (checkWatchdog !== null) {
    clearTimeout(checkWatchdog);
    checkWatchdog = null;
  }
}

export { BRAND_PRESETS };
