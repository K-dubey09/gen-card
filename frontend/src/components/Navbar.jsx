import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-logo">
          📚 Card Maker
        </Link>
        
        <div className="nav-menu">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/pricing" className="nav-link">Pricing</Link>
          <Link to="/transactions" className="nav-link">History</Link>
        </div>
        
        <div className="nav-user">
          <div className="credits-display">
            💳 {user?.credits || 0} credits
          </div>
          <span className="username">👤 {user?.username}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
