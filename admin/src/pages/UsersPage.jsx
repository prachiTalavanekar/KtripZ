import React, { useEffect, useState } from 'react';
import api from '../api';
import { COLORS } from '../theme';
import { format } from 'date-fns';

const ROLES = ['', 'passenger', 'provider', 'admin'];

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/admin/users', { params: { page, role: role || undefined } })
      .then(d => { setUsers(d.users); setTotal(d.total); })
      .catch(console.error);
  }, [page, role]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Users <span style={styles.count}>{total}</span></h2>
        <select style={styles.select} value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
          {ROLES.map(r => <option key={r} value={r}>{r || 'All Roles'}</option>)}
        </select>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              {['Name', 'Email', 'Phone', 'Role', 'Rating', 'Joined'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} style={styles.tr}>
                <td style={styles.td}>{u.name}</td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}>{u.phone}</td>
                <td style={styles.td}><span style={{ ...styles.badge, backgroundColor: u.role === 'provider' ? '#EDE9FE' : '#DBEAFE', color: u.role === 'provider' ? '#7C3AED' : '#1D4ED8' }}>{u.role}</span></td>
                <td style={styles.td}>⭐ {u.rating || '—'}</td>
                <td style={styles.td}>{format(new Date(u.createdAt), 'dd MMM yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={styles.pagination}>
        <button style={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
        <span style={styles.pageInfo}>Page {page}</span>
        <button style={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={users.length < 20}>Next →</button>
      </div>
    </div>
  );
};

const styles = {
  page: { padding: 28 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: COLORS.text },
  count: { fontSize: 14, fontWeight: 500, color: COLORS.textSecondary, marginLeft: 8 },
  select: { padding: '8px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, outline: 'none' },
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

export default UsersPage;
