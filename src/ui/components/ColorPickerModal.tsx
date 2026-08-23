import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { hexToRgb } from '../../shared/color-utils';
import { contrastRatio, wcagLevel } from '../../shared/contrast';

interface ColorPickerModalProps {
  color: string;
  onChange: (hex: string) => void;
  onClose: () => void;
  title?: string;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/**
 * HSV, unrounded.
 *
 * The handle positions are the only consumers, and integer HSV cannot represent
 * every 8-bit RGB colour: #2563EB round-tripped to #2664EB, so opening the
 * picker on the default primary showed a hex two channels off the one stored,
 * and touching either slider committed the drift. 221.19deg / 84.26% / 92.16%
 * comes back as #2563EB exactly.
 *
 * Display rounding happens at the edge — `rgbToHsl` for the HSL fields, and the
 * hex string is built from rounded RGB either way.
 */
function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const v = max;
  let h = 0;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
}

function hsvToRgb(h: number, s: number, v: number) {
  h /= 360; s /= 100; v /= 100;
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function rgbToHexStr(r: number, g: number, b: number): string {
  const toH = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${toH(r)}${toH(g)}${toH(b)}`.toUpperCase();
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  color,
  onChange,
  onClose,
  title,
}) => {
  const [format, setFormat] = useState<'Hex' | 'RGB' | 'HSL'>('Hex');

  // Convert initial color to RGB / HSV
  const initialRgb = hexToRgb(color || '#2563EB');
  const r255 = Math.round(initialRgb.r * 255);
  const g255 = Math.round(initialRgb.g * 255);
  const b255 = Math.round(initialRgb.b * 255);
  const initialHsv = rgbToHsv(r255, g255, b255);

  const [hue, setHue] = useState<number>(initialHsv.h);
  const [sat, setSat] = useState<number>(initialHsv.s);
  const [val, setVal] = useState<number>(initialHsv.v);

  const areaRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  /** Which track the pointer captured on press, or null when not dragging. */
  const drag = useRef<'area' | 'hue' | null>(null);

  // Computed current RGB and Hex
  const currentRgb = hsvToRgb(hue, sat, val);
  const currentHex = rgbToHexStr(currentRgb.r, currentRgb.g, currentRgb.b);
  const currentHsl = rgbToHsl(currentRgb.r, currentRgb.g, currentRgb.b);

  // Notify parent on change
  const emit = (h: number, s: number, v: number) => {
    const rgb = hsvToRgb(h, s, v);
    onChange(rgbToHexStr(rgb.r, rgb.g, rgb.b));
  };

  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

  /**
   * Where a pointer sits along a track, as a 0–1 fraction of its box.
   *
   * The zero-size guard is not theoretical: a track that has not been laid out
   * yet has width 0, and dividing by it produced NaN, which travelled all the
   * way through hsvToRgb into `NaN.toString(16)` and emitted the literal hex
   * string "#NANNANNAN".
   */
  const ratio = (el: HTMLElement, clientX: number, clientY: number) => {
    const rect = el.getBoundingClientRect();
    return {
      x: rect.width > 0 ? clamp01((clientX - rect.left) / rect.width) : 0,
      y: rect.height > 0 ? clamp01((clientY - rect.top) / rect.height) : 0,
    };
  };

  const applyArea = (clientX: number, clientY: number) => {
    const el = areaRef.current;
    if (!el) return;
    const { x, y } = ratio(el, clientX, clientY);
    const s = x * 100;
    const v = (1 - y) * 100;
    setSat(s);
    setVal(v);
    emit(hue, s, v);
  };

  const applyHue = (clientX: number) => {
    const el = hueRef.current;
    if (!el) return;
    const h = ratio(el, clientX, 0).x * 360;
    setHue(h);
    emit(h, sat, val);
  };

  // The window listeners below are installed once and read the current handlers
  // through this ref. Putting [hue, sat, val] in the dependency array instead
  // meant every frame of a drag tore down and reinstalled two window listeners.
  const live = useRef({ applyArea, applyHue, onClose });
  live.current = { applyArea, applyHue, onClose };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const mode = drag.current;
      if (!mode) return;
      // Listening on window, not on the track, is what lets a drag continue
      // once the pointer leaves the 200px-wide slider — which is most of the
      // time. Previously only the 2D area was wired up here at all, so the hue
      // slider responded to a click but not to a drag.
      if (mode === 'area') live.current.applyArea(e.clientX, e.clientY);
      else live.current.applyHue(e.clientX);
    };
    const onUp = () => {
      drag.current = null;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') live.current.onClose();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    // Without pointercancel the drag flag can stick after the OS steals the
    // pointer (a window switch mid-drag), leaving the picker following the
    // cursor with no button held.
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // Pure Hue color for 2D background
  const pureHueRgb = hsvToRgb(hue, 100, 100);
  const pureHueHex = rgbToHexStr(pureHueRgb.r, pureHueRgb.g, pureHueRgb.b);

  return (
    <div className="dsk-picker-backdrop" onClick={onClose}>
      <div
        className="dsk-picker-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Choose a colour'}
      >
        {/* Which colour is being edited. Every call site passes this — a gradient
            stop names its preset and index, a palette swatch names its role — and
            it was being destructured into `_title` and dropped. The Gradients
            panel has 27 identical-looking stops, so an unlabelled picker gave no
            way to tell which one was open. */}
        {title && <div className="dsk-picker-title">{title}</div>}

        {/* Header Tabs */}
        <div className="dsk-picker-tabs">
          {(['Hex', 'RGB', 'HSL'] as const).map((tab) => (
            <button
              key={tab}
              className={`dsk-picker-tab ${format === tab ? 'active' : ''}`}
              onClick={() => setFormat(tab)}
            >
              {tab}
            </button>
          ))}
          <button className="dsk-picker-close" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        {/* 2D Color Saturation / Value Box */}
        <div
          ref={areaRef}
          className="dsk-picker-area"
          style={{ backgroundColor: pureHueHex }}
          onPointerDown={(e) => {
            drag.current = 'area';
            applyArea(e.clientX, e.clientY);
          }}
        >
          <div className="dsk-picker-white-grad" />
          <div className="dsk-picker-black-grad" />
          <div
            className="dsk-picker-handle"
            style={{
              left: `${sat}%`,
              top: `${100 - val}%`,
              backgroundColor: currentHex,
            }}
          />
        </div>

        {/* Hue */}
        <div
          ref={hueRef}
          className="dsk-slider-bar dsk-hue-slider"
          onPointerDown={(e) => {
            drag.current = 'hue';
            applyHue(e.clientX);
          }}
        >
          <div
            className="dsk-slider-handle"
            style={{ left: `${(hue / 360) * 100}%`, backgroundColor: pureHueHex }}
          />
        </div>

        {/*
          What replaced the alpha slider. That slider moved a handle, showed a
          percentage, and was discarded: onChange only ever emitted a 6-digit hex,
          and it could not do otherwise — this colour seeds an 11-step ramp built
          by overlaying it on white and black, so a semi-transparent seed has no
          meaning anywhere downstream.

          Contrast is the thing a designer actually needs to know at the moment
          they pick a brand colour, because it decides whether the colour can
          carry text at all. Measured against white and black rather than guessed
          from lightness.
        */}
        <div className="dsk-picker-contrast">
          {([['#FFFFFF', 'on white'], ['#000000', 'on black']] as const).map(([on, label]) => {
            const cr = contrastRatio(currentHex, on);
            // wcagLevel rather than a second copy of the thresholds here — it is
            // the same grader useBrandTheme and the audit already read from.
            const grade = wcagLevel(cr);
            return (
              <div className="dsk-contrast-chip" key={on}>
                <span className="dsk-contrast-sample" style={{ background: currentHex, color: on }}>
                  Aa
                </span>
                <span className="dsk-contrast-label">{label}</span>
                <span className="dsk-contrast-ratio">{cr.toFixed(2)}:1</span>
                {/* Three states, not two. "AA Large" passing as green would be
                    a lie about body text: it means this pairing is only legal at
                    24px, or 18.66px bold. */}
                <span
                  className={`dsk-contrast-grade ${
                    grade === 'Fail' ? 'fail' : grade === 'AA Large' ? 'warn' : 'pass'
                  }`}
                >
                  {grade}
                </span>
              </div>
            );
          })}
        </div>

        {/* Value Inputs Row */}
        <div className="dsk-picker-inputs">
          {format === 'Hex' && (
            <div className="dsk-input-group">
              <span className="dsk-input-label">Hex</span>
              <input
                type="text"
                className="dsk-picker-field"
                value={currentHex}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    onChange(val);
                    const rgb = hexToRgb(val);
                    const hsv = rgbToHsv(Math.round(rgb.r * 255), Math.round(rgb.g * 255), Math.round(rgb.b * 255));
                    setHue(hsv.h); setSat(hsv.s); setVal(hsv.v);
                  }
                }}
              />
            </div>
          )}

          {format === 'RGB' && (
            <div className="dsk-input-group row-group">
              <label>R <input type="number" value={currentRgb.r} min={0} max={255} onChange={(e) => {
                const r = parseInt(e.target.value) || 0;
                const hsv = rgbToHsv(r, currentRgb.g, currentRgb.b);
                setHue(hsv.h); setSat(hsv.s); setVal(hsv.v);
                onChange(rgbToHexStr(r, currentRgb.g, currentRgb.b));
              }} /></label>

              <label>G <input type="number" value={currentRgb.g} min={0} max={255} onChange={(e) => {
                const g = parseInt(e.target.value) || 0;
                const hsv = rgbToHsv(currentRgb.r, g, currentRgb.b);
                setHue(hsv.h); setSat(hsv.s); setVal(hsv.v);
                onChange(rgbToHexStr(currentRgb.r, g, currentRgb.b));
              }} /></label>

              <label>B <input type="number" value={currentRgb.b} min={0} max={255} onChange={(e) => {
                const b = parseInt(e.target.value) || 0;
                const hsv = rgbToHsv(currentRgb.r, currentRgb.g, b);
                setHue(hsv.h); setSat(hsv.s); setVal(hsv.v);
                onChange(rgbToHexStr(currentRgb.r, currentRgb.g, b));
              }} /></label>
            </div>
          )}

          {format === 'HSL' && (
            <div className="dsk-input-group row-group">
              <label>H <input type="number" value={currentHsl.h} min={0} max={360} readOnly /></label>
              <label>S <input type="number" value={currentHsl.s} min={0} max={100} readOnly /></label>
              <label>L <input type="number" value={currentHsl.l} min={0} max={100} readOnly /></label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
