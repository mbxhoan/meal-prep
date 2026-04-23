import Link from 'next/link';
import { navigationItems } from '@/lib/navigation';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-panel">
        <div className="brand-badge">MF</div>
        <div>
          <p className="brand-title">MealFit Sales Admin</p>
          <p className="brand-subtitle">Starter repo cho vận hành nội bộ</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item) => (
          <Link key={item.href} href={item.href} className="nav-card">
            <span className="nav-label">{item.label}</span>
            <span className="nav-description">{item.description}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
