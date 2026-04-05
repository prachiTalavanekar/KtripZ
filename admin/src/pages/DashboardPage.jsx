import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';
import StatCard from '../components/StatCard';
import { COLORS } from '../theme';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    api.get('/admin/dashboard').then(setStats).catch(console.error);
    api.get('/admin/revenue').then(setRevenue).catch(console.error);
    api.get('/admin/popular-routes').then(setRoutes).catch(console.error);
  }, []);

  return (
    <div style={styles.page}>
      <h2 style={styles.pageTitle}>Dashboard</h2>

      <div style={styles.statsGrid}>
        <StatCard icon="👥" label="Total Users" value={stats?.totalUsers ?? '—'} color={COLORS.primary} />
        <StatCard icon="🚗" label="Total Rides" value={stats?.totalRides ?? '—'} color="#8B5CF6" />
        <StatCard icon="📋" label="Bookings" value={stats?.totalBookings ?? '—'} color={COLORS.success} />
        <StatCard icon="💰" label="Revenue" value={stats ? `₹${stats.totalRevenue.toLocaleString()}` : '—'} color={COLORS.accent} />
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`₹${v}`, 'Revenue']} />
              <Area type="monotone" dataKey="total" stroke={COLORS.primary} fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.routesCard}>
          <h3 style={styles.chartTitle}>Popular Routes</h3>
          {routes.map((r, i) => (
            <div key={i} style={styles.routeRow}>
              <span style={styles.routeRank}>#{i + 1}</span>
              <span style={styles.routeText}>{r._id.origin} → {r._id.destination}</span>
              <span style={styles.routeCount}>{r.count} rides</span>
            </div>
          ))}
          {routes.length === 0 && <p style={{ color: COLORS.textSecondary, fontSize: 13 }}>No data yet</p>}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { padding: 28 },
  pageTitle: { margin: '0 0 24px', fontSize: 22, fontWeight: 800, color: COLORS.text },
  statsGrid: { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 },
  chartsRow: { display: 'flex', gap: 20, flexWrap: 'wrap' },
  chartCard: { flex: 2, minWidth: 320, backgroundColor: COLORS.card, borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  routesCard: { flex: 1, minWidth: 240, backgroundColor: COLORS.card, borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  chartTitle: { margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: COLORS.text },
  routeRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` },
  routeRank: { width: 24, height: 24, borderRadius: 6, backgroundColor: COLORS.primary + '15', color: COLORS.primary, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  routeText: { flex: 1, fontSize: 13, color: COLORS.text, fontWeight: 500 },
  routeCount: { fontSize: 12, color: COLORS.textSecondary },
};

export default DashboardPage;
