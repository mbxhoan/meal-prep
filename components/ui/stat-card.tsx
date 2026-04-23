import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  description,
  tone = 'neutral',
  icon
}: {
  label: string;
  value: string;
  description: string;
  tone?: 'neutral' | 'success' | 'warning';
  icon?: ReactNode;
}) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-description">{description}</p>
    </article>
  );
}
