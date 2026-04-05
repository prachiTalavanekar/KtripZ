import React, { useEffect, useState } from 'react';
import api from '../api';
import { COLORS } from '../theme';
import { format } from 'date-fns';

const STATUS_COLORS = { scheduled: '#D1FAE5', active: '#DBEAFE', completed: '#F3F4F6', cancelled: '#FEE2E2' };
const STATUS_TEXT = { scheduled: '#065F46', active: '#1D4ED8', completed: '#374151', cancelled: '#991B1B' };

const RidesPage = () => {
  const [rides, setRides] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/admin/rides', { params: { page } })
      .then(d => { setRides(d.rides); setTotal(d.total); })
      .catch(console.error);
  }, [page]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Rides <span style={styles.count}>{total}</span></h2>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              {['Route', 'Driver', 'Departure', 'Price', 'Seats', 'Status'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rides.map(r => (
              <tr key={r._id} style={styles.tr}>
                <td style={styles.td}><strong>{r.origin?.name}</strong> → {r.destination?.name}</td>
                <td style={styles.td}>{r.driverId?.name || '—'}</td>
                <td style={styles.td}>{format(new Date(r.departureTime), 'dd MMM yy, hh:mm a')}</td>
                <td style={styles.td}>₹{r.pricePerSeat}</td>
                <td style={styles.td}>{r.availableSeats}/{r.totalSeats}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, backgroundColor: STATUS_COLORS[r.status], color: STATUS_TEXT[r.status] }}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={styles.pagination}>
        <button style={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
        <span style={styles.pageInfo}>Page {page}</span>
        <button style={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={rides.length < 20}>Next →</button>
      </div>
    </div>
  );
};

const styles = {
  page: { padding: 28 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: COLORS.text },
  count: { fontSize: 14, fontWeight: 500, color: COLORS.textSecondary, marginLeft: 8 },
  tableWrap: { backgroundColor: COLORS.card, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: COLORS.bg },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  tr: { borderBottom: `1px solid ${COLORS.border}` },
  td: { padding: '12px 16px', fontSize: 13, color: COLORS.text },
  badge: { padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  pagination: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, justifyContent: 'flex-end' },
  pageBtn: { padding: '8px 16px', borderRadius: 8, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card, cursor: 'pointer', fontSize: 13 },
  pageInfo: { fontSize: 13, color: COLORS.textSecondary },
};

export default RidesPage;
