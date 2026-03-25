import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, TrendingDown,
  BarChart2, Settings, Package,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/income', icon: TrendingUp, label: 'Доходы' },
  { to: '/expenses', icon: TrendingDown, label: 'Расходы' },
  { to: '/analytics', icon: BarChart2, label: 'Аналитика' },
  { to: '/settings', icon: Settings, label: 'Настройки' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Package size={22} />
        <span>ПВЗ Озон</span>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
