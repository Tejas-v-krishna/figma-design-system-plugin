import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { hexToRgb } from '../../shared/color-utils';

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

// HSV / RGB Conversions for 2D Color Area
function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
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
  title: _title,
}) => {
  const [format, setFormat] = useState<'Hex' | 'RGB' | 'HSL' | 'Null'>('RGB');

  // Convert initial color to RGB / HSV
  const initialRgb = hexToRgb(color || '#2563EB');
  const r255 = Math.round(initialRgb.r * 255);
  const g255 = Math.round(initialRgb.g * 255);
  const b255 = Math.round(initialRgb.b * 255);
  const initialHsv = rgbToHsv(r255, g255, b255);

  const [hue, setHue] = useState<number>(initialHsv.h);
  const [sat, setSat] = useState<number>(initialHsv.s);
  const [val, setVal] = useState<number>(initialHsv.v);
  const [alpha, setAlpha] = useState<number>(100);

  const areaRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const alphaRef = useRef<HTMLDivElement>(null);
  /** Which track the pointer captured on press, or null when not dragging. */
  const drag = useRef<'area' | 'hue' | 'alpha' | null>(null);

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
    const s = Math.round(x * 100);
    const v = Math.round((1 - y) * 100);
    setSat(s);
    setVal(v);
    emit(hue, s, v);
  };

  const applyHue = (clientX: number) => {
    const el = hueRef.current;
    if (!el) return;
    const h = Math.round(ratio(el, clientX, 0).x * 360);
    setHue(h);
    emit(h, sat, val);
  };

  const applyAlpha = (clientX: number) => {
    const el = alphaRef.current;
    if (!el) return;
    setAlpha(Math.round(ratio(el, clientX, 0).x * 100));
  };

  // The window listeners below are installed once and read the current handlers
  // through this ref. Putting [hue, sat, val] in the dependency array instead
  // meant every frame of a drag tore down and reinstalled two window listeners.
  const live = useRef({ applyArea, applyHue, applyAlpha, onClose });
  live.current = { applyArea, applyHue, applyAlpha, onClose };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const mode = drag.current;
      if (!mode) return;
      // Listening on window, not on the track, is what lets a drag continue
      // once the pointer leaves the 200px-wide slider — which is most of the
      // time. Previously only the 2D area was wired up here at all, so the hue
      // and alpha sliders responded to a click but not to a drag.
      if (mode === 'area') live.current.applyArea(e.clientX, e.clientY);
      else if (mode === 'hue') live.current.applyHue(e.clientX);
      else live.current.applyAlpha(e.clientX);
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
      <div className="dsk-picker-card" onClick={(e) => e.stopPropagation()}>
        {/* Header Tabs */}
        <div className="dsk-picker-tabs">
          {(['Hex', 'RGB', 'HSL', 'Null'] as const).map((tab) => (
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

        {/* Sliders Section */}
        <div className="dsk-picker-sliders">
          <div className="dsk-picker-slider-row">
            <div className="dsk-slider-spacer" />
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
          </div>

          <div className="dsk-picker-slider-row">
            <div className="dsk-slider-spacer" />
            <div
              ref={alphaRef}
              className="dsk-slider-bar dsk-alpha-slider"
              style={{
                backgroundImage: `linear-gradient(to right, transparent, ${currentHex}), url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="4" height="4" fill="%23ccc"/><rect x="4" width="4" height="4" fill="%23fff"/><rect y="4" width="4" height="4" fill="%23fff"/><rect x="4" y="4" width="4" height="4" fill="%23ccc"/></svg>')`,
              }}
              onPointerDown={(e) => {
                drag.current = 'alpha';
                applyAlpha(e.clientX);
              }}
            >
              <div
                className="dsk-slider-handle"
                style={{ left: `${alpha}%`, backgroundColor: currentHex }}
              />
            </div>
          </div>
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

          {format === 'Null' && (
            <div className="dsk-input-group">
              <span className="dsk-input-label">Transparent</span>
            </div>
          )}

          <div className="dsk-alpha-val">{alpha}%</div>
        </div>
      </div>
    </div>
  );
};
