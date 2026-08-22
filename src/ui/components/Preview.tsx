import { useStore } from '../store';
import { generateColorShades } from '../../shared/color-utils';

function relativeLuminance(hex: string): number {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return 1;
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function Preview() {
  const config = useStore((s) => s.config);
  const shades = generateColorShades(config.primaryColor);
  const order = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;
  const primary = shades['500'];

  return (
    <div className="preview">
      <div className="preview-section">
        <span className="preview-title">Primary palette</span>
        <div className="swatch-row">
          {order.map((s) => {
            const bg = shades[s];
            const labelColor = relativeLuminance(bg) > 0.6 ? '#0c0e13' : '#ffffff';
            return (
              <div key={s} className="swatch" style={{ background: bg }} title={`${s} ${bg}`}>
                <span className="swatch-label" style={{ color: labelColor }}>{s}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="preview-section">
        <span className="preview-title">Sample</span>
        <div className="preview-sample">
          <div className="preview-btn" style={{ background: primary, borderRadius: config.radiusPreset === 'pill' ? 999 : config.radiusPreset === 'sharp' ? 0 : 6 }}>
            Button
          </div>
          <div className="preview-type">
            <div style={{ fontFamily: config.fontFamily.heading, fontWeight: 700, fontSize: 22 }}>Heading specimen</div>
            <div style={{ fontFamily: config.fontFamily.body, fontSize: 13, opacity: 0.7 }}>
              Body text using {config.fontFamily.body}. The quick brown fox jumps over the lazy dog.
            </div>
          </div>
        </div>
      </div>

      <div className="preview-section" style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {(['information', 'success', 'warning', 'error', 'neutral'] as const).map((key) => {
          const hex = (config as any)[`${key}Color`] as string | undefined;
          if (!hex) return null;
          return (
            <div key={key} className="chip" style={{ background: generateColorShades(hex)['500'] }}>
              {key}
            </div>
          );
        })}
      </div>
    </div>
  );
}
