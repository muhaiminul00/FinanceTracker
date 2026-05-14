import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/accounts', label: 'Accounts' },
    { path: '/transactions', label: 'Transactions' },
    { path: '/people', label: 'People' },
  ];

  return (
    <nav className="navbar">
      <div className="nav-brand">💰 Finance Tracker</div>
      <div className="nav-links">
        {navItems.map(item => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={location.pathname === item.path ? 'active' : ''}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="nav-user">
        <button className="btn btn-icon" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <span className="user-name">{user?.name || user?.email}</span>
        <button onClick={logout} className="btn btn-small">Logout</button>
      </div>
    </nav>
  );
}
