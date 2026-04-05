import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { COLORS } from '../theme';

const NAV = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/users', icon: '👥', label: 'Users' },
  { to: '/rides', icon: '🚗', label: 'Rides' },
  { to: '/bookings', icon: '📋', label: 'Bookings' },
  { to: '/revenue', icon: '💰', label: 'Revenue' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const logout = () => { localStorage.removeItem('adminToken'); navigate('/login'); };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <span style={styles.logoK}>K</span>
        <span style={styles.logoText}>TripZ</span>
        <span style={styles.adminBadge}>Admin</span>
      </div>
      <nav style={styles.nav}>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}
            style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}>
            <span style={styles.icon}>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>
      <button style={styles.logoutBtn} onClick={logout}>🚪 Logout</button>
    </aside>
  );
};

const styles = {
  sidebar: { width: 220, minHeight: '100vh', backgroundColor: COLORS.primary, display: 'flex', flexDirection: 'column', padding: '24px 0' },
  logo: { display: 'flex', alignItems: 'center', gap: 6, padding: '0 20px 28px' },
  logoK: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20 },
  logoText: { color: '#fff', fontWeight: 800, fontSize: 20 },
  adminBadge: { backgroundColor: COLORS.accent, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10 },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' },
  link: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14, fontWeight: 500 },
  linkActive: { backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' },
  icon: { fontSize: 18 },
  logoutBtn: { margin: '0 12px', padding: '10px 12px', borderRadius: 8, border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, textAlign: 'left' },
};

export default Sidebar;
