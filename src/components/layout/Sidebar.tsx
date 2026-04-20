import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, TrendingDown,
  BarChart2, Settings, Package,
  Users, CalendarDays, ClipboardList, Wallet,
} from 'lucide-react';

const NAV = [
  { section: 'Финансы' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/income', icon: TrendingUp, label: 'Доходы' },
  { to: '/expenses', icon: TrendingDown, label: 'Расходы' },
  { to: '/analytics', icon: BarChart2, label: 'Аналитика' },
  { section: 'Персонал' },
  { to: '/employees', icon: Users, label: 'Сотрудники' },
  { to: '/schedule', icon: CalendarDays, label: 'График смен' },
  { to: '/shifts', icon: ClipboardList, label: 'Данные смен' },
  { to: '/salaries', icon: Wallet, label: 'Зарплаты' },
  { section: '' },
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
        {NAV.map((item, i) => {
          if ('section' in item) {
            return item.section
              ? <div key={i} className="sidebar-section">{item.section}</div>
              : <div key={i} className="sidebar-divider" />;
          }
          const { to, icon: Icon, label } = item as { to: string; icon: React.ElementType; label: string };
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
