import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';

const EMPTY_FORM = {
  machineId: '',
  customerId: '',
  startDate: '',
  endDate: '',
  advancePayment: '',
  notes: '',
};

function StatusBadge({ status }) {
  const map = { Active: 'badge-green', Pending: 'badge-orange', Completed: 'badge-blue', Cancelled: 'badge-red' };
  return <span className={map[status] || 'badge-zinc'}>{status}</span>;
}

export default function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [machines, setMachines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [statusFilter, setStatusFilter] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rRes, mRes, cRes] = await Promise.all([
        api.get('/rentals'),
        api.get('/machines?status=Available'),
        api.get('/customers'),
      ]);
      setRentals(rRes.data.data);
      setMachines(mRes.data.data);
      setCustomers(cRes.data.data);
    } catch {
      setError('Failed to load rental data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Live price calculation ────────────────────────────────────────────────
  const selectedMachine = useMemo(
    () => machines.find((m) => m._id === form.machineId),
    [machines, form.machineId]
  );

  const calculatedPrice = useMemo(() => {
    if (!selectedMachine || !form.startDate || !form.endDate) return null;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const diffMs = end - start;
    if (diffMs <= 0) return null;
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return { days, total: days * selectedMachine.rentalPricePerDay };
  }, [selectedMachine, form.startDate, form.endDate]);

  const remainingBalance = useMemo(() => {
    if (!calculatedPrice) return null;
    const advance = Number(form.advancePayment) || 0;
    return calculatedPrice.total - advance;
  }, [calculatedPrice, form.advancePayment]);
  // ─────────────────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.machineId || !form.customerId || !form.startDate || !form.endDate) {
      setFormError('Machine, customer, start date and end date are required.');
      return;
    }
    if (!calculatedPrice) {
      setFormError('End date must be after start date.');
      return;
    }
    const advance = Number(form.advancePayment) || 0;
    if (advance > calculatedPrice.total) {
      setFormError('Advance payment cannot exceed total rent.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/rentals', {
        ...form,
        advancePayment: advance,
      });
      setSuccess('Rental created successfully! Machine status updated to Rented.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchAll();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create rental.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/rentals/${id}`, { status });
      setSuccess(`Rental marked as ${status}.`);
      fetchAll();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update rental.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n || 0);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const filteredRentals = statusFilter ? rentals.filter((r) => r.status === statusFilter) : rentals;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Rentals</h1>
          <p className="text-zinc-500 text-sm mt-1">{rentals.length} total rental{rentals.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-40"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Rental
          </button>
        </div>
      </div>

      {success && <div className="bg-emerald-900/30 border border-emerald-800/50 text-emerald-400 text-sm rounded-xl px-4 py-3">{success}</div>}
      {error && <div className="bg-red-900/30 border border-red-800/50 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

      {/* Booking Form */}
      {showForm && (
        <div className="card border-brand-700/40 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-white">Book a Machine</h2>
            <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          {formError && <div className="mb-4 bg-red-900/30 border border-red-800/50 text-red-400 text-sm rounded-xl px-4 py-3">{formError}</div>}

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Available Machine *</label>
                  <select name="machineId" value={form.machineId} onChange={handleChange} className="input">
                    <option value="">Select machine…</option>
                    {machines.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} — {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(m.rentalPricePerDay)}/day
                      </option>
                    ))}
                  </select>
                  {machines.length === 0 && <p className="text-xs text-yellow-500 mt-1">⚠ No available machines.</p>}
                </div>
                <div>
                  <label className="label">Customer *</label>
                  <select name="customerId" value={form.customerId} onChange={handleChange} className="input">
                    <option value="">Select customer…</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date *</label>
                  <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="input" />
                </div>
                <div>
                  <label className="label">End Date *</label>
                  <input type="date" name="endDate" value={form.endDate} min={form.startDate} onChange={handleChange} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Advance Payment (PKR)</label>
                <input
                  type="number"
                  name="advancePayment"
                  value={form.advancePayment}
                  onChange={handleChange}
                  min="0"
                  max={calculatedPrice?.total}
                  placeholder="0"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <input name="notes" value={form.notes} onChange={handleChange} placeholder="Any special instructions…" className="input" />
              </div>
            </div>

            {/* Live Price Preview */}
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-5 flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Price Estimate</p>
              {calculatedPrice ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Duration</span>
                    <span className="text-white font-semibold">{calculatedPrice.days} day{calculatedPrice.days !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Rate/Day</span>
                    <span className="font-mono text-xs text-white">{formatCurrency(selectedMachine?.rentalPricePerDay)}</span>
                  </div>
                  <div className="border-t border-zinc-700 pt-3 flex justify-between">
                    <span className="text-zinc-300 font-semibold">Total Rent</span>
                    <span className="font-display font-bold text-brand-400 text-lg">{formatCurrency(calculatedPrice.total)}</span>
                  </div>
                  {form.advancePayment > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Advance</span>
                        <span className="text-emerald-400">{formatCurrency(Number(form.advancePayment))}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-zinc-700 pt-2">
                        <span className="text-zinc-300 font-semibold">Balance Due</span>
                        <span className={`font-semibold ${remainingBalance > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                          {formatCurrency(remainingBalance)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-zinc-600 text-sm text-center">
                  Select a machine and dates to see price estimate.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 mt-2 border-t border-zinc-800">
            <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary">
              {submitting ? 'Creating Rental…' : 'Confirm Booking'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Rentals Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-sm">Loading rentals…</div>
        ) : filteredRentals.length === 0 ? (
          <div className="py-16 text-center text-zinc-600 text-sm">No rentals found.</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="table-header">Customer</th>
                <th className="table-header">Machine</th>
                <th className="table-header">Period</th>
                <th className="table-header">Total Rent</th>
                <th className="table-header">Advance</th>
                <th className="table-header">Balance</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredRentals.map((r) => (
                <tr key={r._id} className="hover:bg-zinc-800/30 transition-colors animate-fade-in">
                  <td className="table-cell">
                    <p className="font-semibold text-white">{r.customerId?.name}</p>
                    <p className="text-xs text-zinc-600">{r.customerId?.phone}</p>
                  </td>
                  <td className="table-cell">
                    <p className="text-white">{r.machineId?.name}</p>
                    <p className="text-xs text-zinc-600">{r.machineId?.location}</p>
                  </td>
                  <td className="table-cell font-mono text-xs">
                    <p>{formatDate(r.startDate)}</p>
                    <p className="text-zinc-500">→ {formatDate(r.endDate)}</p>
                  </td>
                  <td className="table-cell font-semibold">{formatCurrency(r.totalRent)}</td>
                  <td className="table-cell text-emerald-400">{formatCurrency(r.advancePayment)}</td>
                  <td className={`table-cell font-semibold ${r.remainingBalance > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {formatCurrency(r.remainingBalance)}
                  </td>
                  <td className="table-cell"><StatusBadge status={r.status} /></td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      {r.status === 'Active' && (
                        <button
                          onClick={() => handleStatusUpdate(r._id, 'Completed')}
                          className="text-xs bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 px-2 py-1 rounded-lg border border-blue-800/40 transition-colors"
                        >
                          Complete
                        </button>
                      )}
                      {(r.status === 'Active' || r.status === 'Pending') && (
                        <button
                          onClick={() => handleStatusUpdate(r._id, 'Cancelled')}
                          className="text-xs bg-red-900/30 hover:bg-red-800/50 text-red-400 px-2 py-1 rounded-lg border border-red-800/30 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
