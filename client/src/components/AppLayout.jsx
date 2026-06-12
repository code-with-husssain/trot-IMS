import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const nav = [
  { to: '/', label: 'Dashboard', end: true, icon: '◧' },
  { to: '/clients', label: 'Clients', icon: '◍' },
  { to: '/invoices', label: 'Invoices', icon: '▤' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-gray-100 bg-white px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <Logo size={40} />
          <div>
            <div className="text-sm font-bold leading-tight">Trot TK</div>
            <div className="text-xs text-gray-400">Invoice Manager</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout} className="btn-ghost mt-4 w-full">
          Log out
        </button>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3 md:hidden">
            <Logo size={32} />
            <span className="font-bold">Trot TK</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold">{user?.name}</div>
              <div className="text-xs text-gray-400">{user?.email}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>
        <main className="flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
