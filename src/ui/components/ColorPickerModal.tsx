import React, { useState, useRef, useEffect } from 'react';
import { Pipette, X } from 'lucide-react';
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
  const isDraggingArea = useRef<boolean>(false);
  const isDraggingHue = useRef<boolean>(false);
  const isDraggingAlpha = useRef<boolean>(false);

  // Computed current RGB and Hex
  const currentRgb = hsvToRgb(hue, sat, val);
  const currentHex = rgbToHexStr(currentRgb.r, currentRgb.g, currentRgb.b);
  const currentHsl = rgbToHsl(currentRgb.r, currentRgb.g, currentRgb.b);

  // Notify parent on change
  const updateColor = (h: number, s: number, v: number) => {
    const rgb = hsvToRgb(h, s, v);
    const hex = rgbToHexStr(rgb.r, rgb.g, rgb.b);
    onChange(hex);
  };

  const handleAreaPointer = (e: React.PointerEvent | PointerEvent) => {
    if (!areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const newSat = Math.round((x / rect.width) * 100);
    const newVal = Math.round((1 - y / rect.height) * 100);

    setSat(newSat);
    setVal(newVal);
    updateColor(hue, newSat, newVal);
  };

  const handleHuePointer = (e: React.PointerEvent | PointerEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const newHue = Math.round((x / rect.width) * 360);

    setHue(newHue);
    updateColor(newHue, sat, val);
  };

  const handleAlphaPointer = (e: React.PointerEvent | PointerEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const newAlpha = Math.round((x / rect.width) * 100);

    setAlpha(newAlpha);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (isDraggingArea.current) handleAreaPointer(e);
    };
    const onUp = () => {
      isDraggingArea.current = false;
      isDraggingHue.current = false;
      isDraggingAlpha.current = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [hue, sat, val]);

  // Pure Hue color for 2D background
  const pureHueRgb = hsvToRgb(hue, 100, 100);
  const pureHueHex = rgbToHexStr(pureHueRgb.r, pureHueRgb.g, pureHueRgb.b);

  return (
    <div className="figr-picker-backdrop" onClick={onClose}>
      <div className="figr-picker-card" onClick={(e) => e.stopPropagation()}>
        {/* Header Tabs */}
        <div className="figr-picker-tabs">
          {(['Hex', 'RGB', 'HSL', 'Null'] as const).map((tab) => (
            <button
              key={tab}
              className={`figr-picker-tab ${format === tab ? 'active' : ''}`}
              onClick={() => setFormat(tab)}
            >
              {tab}
            </button>
          ))}
          <button className="figr-picker-close" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        {/* 2D Color Saturation / Value Box */}
        <div
          ref={areaRef}
          className="figr-picker-area"
          style={{ backgroundColor: pureHueHex }}
          onPointerDown={(e) => {
            isDraggingArea.current = true;
            handleAreaPointer(e);
          }}
        >
          <div className="figr-picker-white-grad" />
          <div className="figr-picker-black-grad" />
          <div
            className="figr-picker-handle"
            style={{
              left: `${sat}%`,
              top: `${100 - val}%`,
              backgroundColor: currentHex,
            }}
          />
        </div>

        {/* Sliders Section */}
        <div className="figr-picker-sliders">
          <div className="figr-picker-slider-row">
            <button className="dsk-pipette-btn" title="Pick color">
              <Pipette size={14} />
            </button>
            <div
              className="dsk-slider-bar figr-hue-slider"
              onPointerDown={(e) => {
                isDraggingHue.current = true;
                handleHuePointer(e);
              }}
            >
              <div
                className="dsk-slider-handle"
                style={{ left: `${(hue / 360) * 100}%`, backgroundColor: pureHueHex }}
              />
            </div>
          </div>

          <div className="figr-picker-slider-row">
            <div className="dsk-slider-spacer" />
            <div
              className="dsk-slider-bar figr-alpha-slider"
              style={{
                backgroundImage: `linear-gradient(to right, transparent, ${currentHex}), url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="4" height="4" fill="%23ccc"/><rect x="4" width="4" height="4" fill="%23fff"/><rect y="4" width="4" height="4" fill="%23fff"/><rect x="4" y="4" width="4" height="4" fill="%23ccc"/></svg>')`,
              }}
              onPointerDown={(e) => {
                isDraggingAlpha.current = true;
                handleAlphaPointer(e);
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
        <div className="figr-picker-inputs">
          {format === 'Hex' && (
            <div className="dsk-input-group">
              <span className="dsk-input-label">Hex</span>
              <input
                type="text"
                className="figr-picker-field"
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

          <div className="figr-alpha-val">{alpha}%</div>
        </div>
      </div>
    </div>
  );
};
