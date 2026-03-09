import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, icon, colorClass, sub }) {
  return (
    <div className="card animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-display font-bold text-white tabular-nums">{value ?? '—'}</p>
      <p className="text-sm text-zinc-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [machineStats, setMachineStats] = useState(null);
  const [rentalStats, setRentalStats] = useState(null);
  const [recentRentals, setRecentRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [mRes, rRes, rentRes] = await Promise.all([
          api.get('/machines/stats'),
          api.get('/rentals/stats'),
          api.get('/rentals?status=Active'),
        ]);
        setMachineStats(mRes.data.data);
        setRentalStats(rRes.data.data);
        setRecentRentals(rentRes.data.data.slice(0, 5));
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n || 0);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const statusBadge = (s) => {
    const map = { Active: 'badge-green', Pending: 'badge-orange', Completed: 'badge-blue', Cancelled: 'badge-red' };
    return <span className={map[s] || 'badge-zinc'}>{s}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 text-brand-500 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-zinc-500 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Machine Stats */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-4">Fleet Overview</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Machines"
            value={machineStats?.total}
            colorClass="bg-zinc-800"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" className="w-5 h-5"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>}
          />
          <StatCard
            label="Available"
            value={machineStats?.available}
            colorClass="bg-emerald-900/40"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" className="w-5 h-5"><polyline points="20,6 9,17 4,12" /></svg>}
          />
          <StatCard
            label="Currently Rented"
            value={machineStats?.rented}
            colorClass="bg-brand-900/40"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
          />
          <StatCard
            label="In Maintenance"
            value={machineStats?.maintenance}
            colorClass="bg-yellow-900/40"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" className="w-5 h-5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>}
          />
        </div>
      </div>

      {/* Rental Stats */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-4">Rental Summary</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Rentals"
            value={rentalStats?.total}
            colorClass="bg-zinc-800"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" className="w-5 h-5"><path d="M3 3h18v18H3z" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>}
          />
          <StatCard
            label="Active Rentals"
            value={rentalStats?.active}
            colorClass="bg-brand-900/40"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>}
          />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(rentalStats?.totalRevenue)}
            colorClass="bg-emerald-900/40"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" className="w-5 h-5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
          />
          <StatCard
            label="Completed"
            value={rentalStats?.completed}
            colorClass="bg-blue-900/40"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" className="w-5 h-5"><polyline points="9,11 12,14 22,4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>}
          />
        </div>
      </div>

      {/* Recent Active Rentals */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-4">Active Rentals</p>
        <div className="card p-0 overflow-hidden">
          {recentRentals.length === 0 ? (
            <div className="py-12 text-center text-zinc-600 text-sm">No active rentals at this time.</div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-zinc-800">
                <tr>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Machine</th>
                  <th className="table-header">Start</th>
                  <th className="table-header">End</th>
                  <th className="table-header">Total Rent</th>
                  <th className="table-header">Balance</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {recentRentals.map((rental) => (
                  <tr key={rental._id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="table-cell font-medium text-white">{rental.customerId?.name}</td>
                    <td className="table-cell">{rental.machineId?.name}</td>
                    <td className="table-cell font-mono text-xs">{formatDate(rental.startDate)}</td>
                    <td className="table-cell font-mono text-xs">{formatDate(rental.endDate)}</td>
                    <td className="table-cell font-semibold">{formatCurrency(rental.totalRent)}</td>
                    <td className={`table-cell font-semibold ${rental.remainingBalance > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                      {formatCurrency(rental.remainingBalance)}
                    </td>
                    <td className="table-cell">{statusBadge(rental.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
