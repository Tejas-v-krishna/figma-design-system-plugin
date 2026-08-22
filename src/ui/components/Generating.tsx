import { useStore } from '../store';

export function GeneratingOverlay() {
  const progress = useStore((s) => s.progress);
  const message = useStore((s) => s.progressMessage);
  return (
    <div className="overlay">
      <div className="overlay-card">
        <div className="spinner" />
        <h2>Generating your design system</h2>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-meta">
          <span>{Math.round(progress)}%</span>
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
}
