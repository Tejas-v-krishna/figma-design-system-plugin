import type { ReactNode, CSSProperties } from 'react';
import { useState, useEffect, forwardRef } from 'react';
import { useStore } from '../store';

const HEADING_FONTS = [
  'Inter', 'Roboto', 'Poppins', 'Montserrat', 'Open Sans', 'Playfair Display',
  'IBM Plex Sans', 'Lato', 'Source Sans 3', 'Nunito Sans', 'DM Sans',
];
const BODY_FONTS = HEADING_FONTS;
const MONO_FONTS = ['IBM Plex Mono', 'Roboto Mono', 'JetBrains Mono', 'Fira Code', 'Source Code Pro'];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  // Hold the text locally so partial/invalid input (e.g. while typing) never
  // reaches the controlled native color input, which requires a full #rrggbb.
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handle = (raw: string) => {
    setText(raw);
    if (HEX_RE.test(raw)) onChange(raw.toUpperCase());
  };

  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="color-row">
        <input
          type="color"
          value={value}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            setText(v);
            onChange(v);
          }}
        />
        <input
          className="text-input hex"
          value={text}
          spellCheck={false}
          onChange={(e) => handle(e.target.value)}
          onBlur={() => {
            if (!HEX_RE.test(text) && HEX_RE.test(value)) setText(value);
          }}
        />
      </span>
    </label>
  );
}

export function FontSelect({ label, value, kind, onChange }: { label: string; value: string; kind: 'heading' | 'body' | 'mono'; onChange: (v: string) => void }) {
  // Prefer fonts Figma actually has installed; fall back to the curated list
  // until that message arrives (or if it never does, e.g. offline).
  const availableFonts = useStore((s) => s.availableFonts);
  const base = availableFonts ?? (kind === 'mono' ? MONO_FONTS : kind === 'heading' ? HEADING_FONTS : BODY_FONTS);
  // Always include the current value so a non-installed default still shows
  // instead of rendering a blank select.
  const options = base.includes(value) ? base : [value, ...base];
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select className="text-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
    </label>
  );
}

export function SegmentedControl<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="segmented">
        {options.map((o) => (
          <button
            key={o.value}
            className={value === o.value ? 'seg active' : 'seg'}
            onClick={() => onChange(o.value)}
            type="button"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RangeField({ label, value, min, max, step, suffix, onChange }: {
  label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (v: number) => void;
}) {
  return (
    <label className="field">
      <span className="field-label">{label} <strong>{value}{suffix}</strong></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track"><span className="toggle-thumb" /></span>
      <span className="toggle-label">{label}</span>
    </label>
  );
}

// forwardRef so a dialog can move focus to its primary action on open. Without
// it a keyboard user landing in a modal has to tab in from wherever focus
// happened to be, which for a confirmation dialog means the destructive button
// is reachable before the text explaining it has been read out.
export const Button = forwardRef<HTMLButtonElement, {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  type?: 'button' | 'submit';
  style?: CSSProperties;
}>(function Button({ children, onClick, variant = 'primary', disabled, type = 'button', style }, ref) {
  return (
    <button ref={ref} className={`btn ${variant}`} onClick={onClick} disabled={disabled} type={type} style={style}>
      {children}
    </button>
  );
});
