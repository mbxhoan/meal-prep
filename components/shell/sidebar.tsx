import Image from 'next/image';
import Link from 'next/link';
import { navigationItems } from '@/lib/navigation';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-panel">
        <div className="brand-mark">
          <Image src="/logo-square.jpg" alt="MealFit" fill sizes="56px" className="brand-mark-image" priority />
        </div>
        <div className="brand-copy">
          {/* <div className="brand-wordmark">
            <Image src="/logo.jpg" alt="MealFit Sales Admin" fill sizes="180px" className="brand-wordmark-image" priority />
          </div> */}
          <p className="brand-subtitle">{process.env.NEXT_PUBLIC_APP_NAME}</p>
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
