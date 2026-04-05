import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';
import { COLORS } from '../theme';

const RevenuePage = () => {
  const [revenue, setRevenue] = useState([]);

  useEffect(() => {
    api.get('/admin/revenue').then(setRevenue).catch(console.error);
  }, []);

  const total = revenue.reduce((s, r) => s + r.total, 0);

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Revenue Analytics</h2>
      <div style={styles.totalCard}>
        <p style={styles.totalLabel}>Total Platform Revenue</p>
        <p style={styles.totalValue}>₹{total.toLocaleString()}</p>
      </div>
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Daily Revenue</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={revenue}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => [`₹${v}`, 'Revenue']} />
            <Bar dataKey="total" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const styles = {
  page: { padding: 28 },
  title: { margin: '0 0 24px', fontSize: 22, fontWeight: 800, color: COLORS.text },
  totalCard: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 24, marginBottom: 24, display: 'inline-block', minWidth: 240 },
  totalLabel: { margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  totalValue: { margin: '8px 0 0', color: '#fff', fontSize: 36, fontWeight: 800 },
  chartCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  chartTitle: { margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: COLORS.text },
};

export default RevenuePage;
