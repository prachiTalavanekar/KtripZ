import React from 'react';
import { COLORS } from '../theme';

const StatCard = ({ icon, label, value, color = COLORS.primary }) => (
  <div style={styles.card}>
    <div style={{ ...styles.iconWrap, backgroundColor: color + '15' }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
    </div>
    <div>
      <p style={styles.label}>{label}</p>
      <p style={{ ...styles.value, color }}>{value}</p>
    </div>
  </div>
);

const styles = {
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flex: 1, minWidth: 160 },
  iconWrap: { width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  label: { margin: 0, fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 },
  value: { margin: '4px 0 0', fontSize: 26, fontWeight: 800 },
};

export default StatCard;
