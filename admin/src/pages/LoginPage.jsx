import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { COLORS } from '../theme';

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/auth/login', form);
      if (data.user.role !== 'admin') { setError('Access denied. Admin only.'); setLoading(false); return; }
      localStorage.setItem('adminToken', data.token);
      navigate('/');
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoCircle}><span style={{ color: '#fff', fontWeight: 800, fontSize: 28 }}>K</span></div>
          <div>
            <h1 style={styles.appName}>KTripZ</h1>
            <p style={styles.adminLabel}>Admin Panel</p>
          </div>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleLogin}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', backgroundColor: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 40, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  logo: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 },
  logoCircle: { width: 56, height: 56, borderRadius: 14, backgroundColor: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  appName: { margin: 0, fontSize: 24, fontWeight: 800, color: COLORS.text },
  adminLabel: { margin: 0, fontSize: 13, color: COLORS.textSecondary },
  error: { backgroundColor: '#FEE2E2', color: COLORS.error, padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 13 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: COLORS.text, marginBottom: 6 },
  input: { width: '100%', height: 44, borderRadius: 8, border: `1px solid ${COLORS.border}`, padding: '0 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  btn: { width: '100%', height: 48, borderRadius: 8, backgroundColor: COLORS.primary, color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
};

export default LoginPage;
