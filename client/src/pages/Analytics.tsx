import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';
import { api, isLoggedIn } from '../lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Summary {
  totals: {
    people: number;
    pending: number;
    families: number;
    condolences: number;
    reactions: number;
    views: number;
  };
  byWard: Array<{ ward: string; count: number }>;
  byMonth: Array<{ month: string; count: number }>;
  reactionsBreakdown: Array<{ kind: string; count: number }>;
}

interface DeceasedRow {
  id: number;
  fullName: string;
  hausaName: string | null;
  ward: string;
  dateOfBirth: string | null;
  dateOfDeath: string;
  createdAt: string;
}

interface ReportRow extends DeceasedRow {
  condolenceCount: number;
  rememberCount: number;
  prayCount: number;
}

type Range = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

const CHART_COLORS = ['#1e3a5f', '#14795f', '#7a1f1f', '#b8860b', '#6f4e37', '#c0392b', '#3f6b8a'];

function ageAtDeath(birth: string | null, death: string): string {
  if (!birth) return '';
  const b = new Date(birth);
  const d = new Date(death);
  if (isNaN(b.getTime()) || isNaN(d.getTime())) return '';
  let years = d.getFullYear() - b.getFullYear();
  let months = d.getMonth() - b.getMonth();
  let days = d.getDate() - b.getDate();
  if (days < 0) { months -= 1; days += new Date(d.getFullYear(), d.getMonth(), 0).getDate(); }
  if (months < 0) { years -= 1; months += 12; }
  return `${years}y ${months}m ${days}d`;
}

const RANGE_LABELS: Record<Range, string> = {
  today: 'Today',
  week: 'This week',
  month: 'This month',
  year: 'This year',
  all: 'All time',
  custom: 'Custom',
};

export default function Analytics() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState(false);

  const [range, setRange] = useState<Range>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [search, setSearch] = useState('');

  const [rows, setRows] = useState<DeceasedRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rowsLoading, setRowsLoading] = useState(false);
  const pageSize = 15;

  const [role, setRole] = useState('');
  const isModerator = isLoggedIn() && (role === 'moderator' || role === 'admin');

  useEffect(() => {
    api<Summary>('/api/analytics/summary')
      .then(setData)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) return;
    api<{ user: { role: string } }>('/api/auth/me')
      .then((r) => setRole(r.user.role))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setRowsLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
      sort: 'dod_newest',
    });
    if (wardFilter) params.set('ward', wardFilter);
    if (search.trim()) params.set('q', search.trim());
    if (range === 'custom' && fromDate) params.set('year', fromDate.slice(0, 4));

    api<{ items: DeceasedRow[]; total: number }>(`/api/deceased?${params.toString()}`)
      .then((r) => {
        setRows(r.items);
        setTotal(r.total);
      })
      .catch(() => {})
      .finally(() => setRowsLoading(false));
  }, [page, fromDate, toDate, wardFilter, search, range]);

  if (error) return <p className="error">Could not load statistics.</p>;
  if (!data) return <div className="skeleton" />;

  const { totals, byWard, byMonth, reactionsBreakdown } = data;

  let running = 0;
  const cumulative = byMonth.map((m) => {
    running += m.count;
    return { month: m.month, total: running };
  });

  const reactionLabels: Record<string, string> = { remember: 'I remember', pray: 'Prayers' };
  const reactionData = reactionsBreakdown.map((r) => ({
    name: reactionLabels[r.kind] ?? r.kind,
    value: r.count,
  }));

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function resetFilters() {
    setFromDate('');
    setToDate('');
    setWardFilter('');
    setSearch('');
    setPage(1);
    setRange('all');
  }

  async function fetchReport(): Promise<ReportRow[]> {
    const params = new URLSearchParams({ range });
    if (wardFilter) params.set('ward', wardFilter);
    if (search.trim()) params.set('q', search.trim());
    if (range === 'custom') {
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
    }
    const res = await api<{ items: ReportRow[] }>(`/api/analytics/report?${params.toString()}`);
    return res.items;
  }

  async function exportPdf() {
    try {
      const items = await fetchReport();
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(14);
      doc.text('Kudan Memorial, deceased register', 14, 14);
      doc.setFontSize(10);
      doc.text(
        `Range: ${RANGE_LABELS[range]}  ·  Ward: ${wardFilter || 'all'}  ·  Search: ${search || 'none'}  ·  Rows: ${items.length}`,
        14, 20
      );
      autoTable(doc, {
        startY: 26,
        head: [['#', 'Full name', 'Hausa name', 'Ward', 'Died', 'Reactions', 'Condolences']],
        body: items.map((r, i) => [
          String(i + 1),
          r.fullName,
          r.hausaName ?? '',
          r.ward,
          new Date(r.dateOfDeath).toLocaleDateString('en-GB'),
          String(r.rememberCount + r.prayCount),
          String(r.condolenceCount),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 58, 95] },
      });
      doc.save(`kudan-deceased-${range}-${Date.now()}.pdf`);
    } catch {
      alert('Could not generate the PDF. Are you logged in as a moderator?');
    }
  }

  async function exportExcel() {
    try {
      const items = await fetchReport();
      const header = ['ID', 'Full name', 'Hausa name', 'Ward', 'Date of birth', 'Date of death', 'Reactions', 'Condolences'];
      const lines = [header.join('\t')];
      for (const r of items) {
        lines.push([
          r.id,
          r.fullName,
          r.hausaName ?? '',
          r.ward,
          r.dateOfBirth ?? '',
          r.dateOfDeath,
          r.rememberCount + r.prayCount,
          r.condolenceCount,
        ].join('\t'));
      }
      const blob = new Blob([lines.join('\n')], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kudan-deceased-${range}-${Date.now()}.xls`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not generate the Excel file. Are you logged in as a moderator?');
    }
  }

  return (
    <div>
      <h1>Statistics</h1>
      <p className="muted">An overview of everyone remembered in Kudan. Updated live.</p>

      <div className="stat-panel">
        <StatCard label="Remembered" value={totals.people} tone="navy" />
        <StatCard label="Families" value={totals.families} tone="teal" />
        <StatCard label="Condolences" value={totals.condolences} tone="navy" />
        <StatCard label="Reactions" value={totals.reactions} tone="teal" />
        <StatCard label="Page views" value={totals.views} tone="navy" />
        <StatCard label="Awaiting review" value={totals.pending} tone="teal" />
      </div>

      <div className="range-bar">
        {(['today', 'week', 'month', 'year', 'all'] as const).map((r) => (
          <button
            key={r}
            className={`range-btn${range === r ? ' active' : ''}`}
            onClick={() => setRange(r)}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
        <button
          className={`range-btn${range === 'custom' ? ' active' : ''}`}
          onClick={() => setRange('custom')}
        >
          Custom range
        </button>
      </div>

      <div className="filter-bar">
        <div className="filter-field">
          <label>Search</label>
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Name or Hausa name"
          />
        </div>
        <div className="filter-field">
          <label>From</label>
          <input
            type="date"
            lang="en-GB"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          />
        </div>
        <div className="filter-field">
          <label>To</label>
          <input
            type="date"
            lang="en-GB"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          />
        </div>
        <div className="filter-field">
          <label>Ward / Area</label>
          <select value={wardFilter} onChange={(e) => { setWardFilter(e.target.value); setPage(1); }}>
            <option value="">All wards</option>
            {byWard.map((w) => (
              <option key={w.ward} value={w.ward}>{w.ward}</option>
            ))}
          </select>
        </div>
        <button className="btn secondary" onClick={resetFilters}>Reset</button>

        {isModerator && (
          <>
            <button className="btn approve" onClick={exportPdf}>Download PDF</button>
            <button className="btn approve" onClick={exportExcel}>Download Excel</button>
          </>
        )}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>By ward</h3>
          {byWard.length === 0 ? (
            <p className="muted">No records yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byWard} dataKey="count" nameKey="ward" cx="50%" cy="50%" outerRadius={90}>
                  {byWard.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Reactions</h3>
          {reactionData.length === 0 || reactionData.every((r) => r.value === 0) ? (
            <p className="muted">No reactions yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={reactionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90}>
                  {reactionData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: '1.5rem' }}>
        <h3>Records per month</h3>
        {byMonth.length === 0 ? (
          <p className="muted">No records yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dcdcdc" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Entries" fill="#1e3a5f" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="chart-card" style={{ marginTop: '1.5rem' }}>
        <h3>Cumulative records</h3>
        {cumulative.length === 0 ? (
          <p className="muted">No records yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulative}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dcdcdc" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                name="Total records"
                stroke="#14795f"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="chart-card" style={{ marginTop: '1.5rem' }}>
        <h3>All records ({total})</h3>
        {rowsLoading ? (
          <div className="skeleton" />
        ) : rows.length === 0 ? (
          <p className="muted">No records match your filters.</p>
        ) : (
          <>
            <div className="table-scroll">
              <table className="ranked-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Ward / Area</th>
                    <th>Died</th>
                    <th>Age at death</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id}>
                      <td>{(page - 1) * pageSize + i + 1}</td>
                      <td>
                        <Link to={`/deceased/${r.id}`}>{r.fullName}</Link>
                        {r.hausaName ? <div className="muted" style={{ fontSize: '0.82rem' }}>{r.hausaName}</div> : null}
                      </td>
                      <td>{r.ward}</td>
                      <td>{new Date(r.dateOfDeath).toLocaleDateString('en-GB')}</td>
                      <td>{ageAtDeath(r.dateOfBirth, r.dateOfDeath) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  className="btn secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'navy' | 'teal' }) {
  return (
    <div className={`stat-panel-card ${tone}`}>
      <div className="stat-panel-value">{value}</div>
      <div className="stat-panel-label">{label}</div>
    </div>
  );
}