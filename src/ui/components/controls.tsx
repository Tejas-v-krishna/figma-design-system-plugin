import type { ReactNode, CSSProperties } from 'react';
import { useState, useEffect, forwardRef } from 'react';
import { useStore } from '../store';

const HEADING_FONTS = [
  'Google Sans', 'Google Sans Text', 'Product Sans', 'Geist', 'Inter', 'Roboto', 'Poppins', 'Montserrat', 'Open Sans', 'Playfair Display',
  'IBM Plex Sans', 'Lato', 'Source Sans 3', 'Nunito Sans', 'DM Sans',
];
const BODY_FONTS = HEADING_FONTS;
const MONO_FONTS = ['Google Sans', 'Google Sans Text', 'Product Sans', 'Geist Mono', 'IBM Plex Mono', 'Roboto Mono', 'JetBrains Mono', 'Fira Code', 'Source Code Pro'];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function Row({
  label,
  desc,
  control,
  children,
  stack,
}: {
  label: string;
  desc?: string;
  control?: ReactNode;
  children?: ReactNode;
  stack?: boolean;
}) {
  return (
    <div className={`dsk-row${stack ? ' dsk-row-stack' : ''}`}>
      <div className="dsk-row-text">
        <span className="dsk-row-label">{label}</span>
        {desc && <span className="dsk-row-desc">{desc}</span>}
      </div>
      <div className="dsk-row-control">
        {control ?? children}
      </div>
    </div>
  );
}

export function Badge({
  children,
  status,
  className = '',
}: {
  children: ReactNode;
  status?: 'ok' | 'warn' | 'bad';
  className?: string;
}) {
  const statusClass = status ? ` ${status}` : '';
  return (
    <span className={`dsk-badge${statusClass} ${className}`}>
      {children}
    </span>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handle = (raw: string) => {
    setText(raw);
    if (HEX_RE.test(raw)) onChange(raw.toUpperCase());
  };

  return (
    <label className="dsk-field">
      <span className="dsk-field-label">{label}</span>
      <span className="dsk-color-row">
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
          className="dsk-input hex"
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
  const availableFonts = useStore((s) => s.availableFonts);
  const base = availableFonts ?? (kind === 'mono' ? MONO_FONTS : kind === 'heading' ? HEADING_FONTS : BODY_FONTS);
  const options = base.includes(value) ? base : [value, ...base];
  return (
    <label className="dsk-field">
      <span className="dsk-field-label">{label}</span>
      <select className="dsk-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
    </label>
  );
}

export function SegmentedControl<T extends string>({ label, value, options, onChange }: {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className={label ? 'dsk-field' : undefined}>
      {label && <span className="dsk-field-label">{label}</span>}
      <div className="dsk-seg">
        {options.map((o) => (
          <button
            key={o.value}
            className={value === o.value ? 'active' : ''}
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
    <label className="dsk-field">
      <span className="dsk-field-label">{label} <strong>{value}{suffix}</strong></span>
      <input className="dsk-range" type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="dsk-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="dsk-toggle-track"><span className="dsk-toggle-thumb" /></span>
      <span className="dsk-toggle-label">{label}</span>
    </label>
  );
}

export const Button = forwardRef<HTMLButtonElement, {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  type?: 'button' | 'submit';
  style?: CSSProperties;
}>(function Button({ children, onClick, variant = 'primary', disabled, type = 'button', style }, ref) {
  return (
    <button ref={ref} className={`dsk-btn ${variant}`} onClick={onClick} disabled={disabled} type={type} style={style}>
      {children}
    </button>
  );
});
