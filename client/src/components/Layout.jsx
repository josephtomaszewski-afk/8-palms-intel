import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <img src="/logo.png" alt="8 Palms" className="brand-logo" />
          <div className="brand-text">
            <span className="brand-sub">Section 8 Market Intelligence</span>
            <span className="brand-confidential">CONFIDENTIAL — Authorized Users Only. Property of 8 Palms Private Equity Group.</span>
          </div>
        </div>
        <div className="navbar-links">
          <Link to="/">DASHBOARD</Link>
          <Link to="/analysis">ANALYSIS</Link>
          <Link to="/value-add">VALUE ADD MF</Link>
          <Link to="/map">MAP</Link>
          <Link to="/saved">SAVED</Link>
        </div>
        <div className="navbar-user">
          <span className="welcome-text">Welcome, {user?.firstName}</span>
          <button onClick={handleLogout} className="btn-logout">Log Out</button>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <a href="https://8-palms.com" target="_blank" rel="noopener noreferrer">8-palms.com</a>
        <span> | Confidential - 8 Palms Private Equity Group LLC | </span>
        <Link to="/excluded" className="footer-link">Excluded Properties</Link>
      </footer>
    </div>
  )
}

export default Layout
