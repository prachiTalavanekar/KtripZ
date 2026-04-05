import React, { useEffect, useState } from 'react';
import api from '../api';
import { COLORS } from '../theme';
import { format } from 'date-fns';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/admin/bookings', { params: { page } })
      .then(d => { setBookings(d.bookings); setTotal(d.total); })
      .catch(console.error);
  }, [page]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Bookings <span style={styles.count}>{total}</span></h2>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              {['Passenger', 'Route', 'Seats', 'Amount', 'Status', 'Payment', 'Date'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b._id} style={styles.tr}>
                <td style={styles.td}>{b.passengerId?.name || '—'}</td>
                <td style={styles.td}>{b.rideId?.origin?.name} → {b.rideId?.destination?.name}</td>
                <td style={styles.td}>{b.seatsBooked}</td>
                <td style={styles.td}>₹{b.totalAmount}</td>
                <td style={styles.td}><span style={styles.badge}>{b.status}</span></td>
                <td style={styles.td}><span style={{ ...styles.badge, backgroundColor: b.paymentStatus === 'paid' ? '#D1FAE5' : '#FEF3C7', color: b.paymentStatus === 'paid' ? '#065F46' : '#92400E' }}>{b.paymentStatus}</span></td>
                <td style={styles.td}>{format(new Date(b.createdAt), 'dd MMM yy')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={styles.pagination}>
        <button style={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
        <span style={styles.pageInfo}>Page {page}</span>
        <button style={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={bookings.length < 20}>Next →</button>
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
  badge: { padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: '#F3F4F6', color: '#374151' },
  pagination: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, justifyContent: 'flex-end' },
  pageBtn: { padding: '8px 16px', borderRadius: 8, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card, cursor: 'pointer', fontSize: 13 },
  pageInfo: { fontSize: 13, color: COLORS.textSecondary },
};

export default BookingsPage;
