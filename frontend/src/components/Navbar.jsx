import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
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
        <span>{user?.name || user?.email}</span>
        <button onClick={logout} className="btn btn-small">Logout</button>
      </div>
    </nav>
  );
}
