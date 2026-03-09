import { useState, useEffect } from 'react';
import api from '../api/axios';

const EMPTY_FORM = { machineId: '', date: '', issue: '', cost: '', nextMaintenanceDate: '', resolvedBy: '', status: 'Completed', notes: '' };

function StatusBadge({ status }) {
  const map = { Completed: 'badge-green', 'In Progress': 'badge-orange', Scheduled: 'badge-blue' };
  return <span className={map[status] || 'badge-zinc'}>{status}</span>;
}

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mRes, machRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/machines'),
      ]);
      setRecords(mRes.data.data);
      setMachines(machRes.data.data);
    } catch {
      setError('Failed to load maintenance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split('T')[0] });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (rec) => {
    setEditId(rec._id);
    setForm({
      machineId: rec.machineId?._id || '',
      date: rec.date ? new Date(rec.date).toISOString().split('T')[0] : '',
      issue: rec.issue,
      cost: rec.cost,
      nextMaintenanceDate: rec.nextMaintenanceDate ? new Date(rec.nextMaintenanceDate).toISOString().split('T')[0] : '',
      resolvedBy: rec.resolvedBy || '',
      status: rec.status,
      notes: rec.notes || '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.machineId || !form.issue || form.cost === '') {
      setFormError('Machine, issue, and cost are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editId) {
        await api.put(`/maintenance/${editId}`, form);
        setSuccess('Maintenance record updated.');
      } else {
        await api.post('/maintenance', form);
        setSuccess('Maintenance record created.');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      fetchAll();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save record.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n || 0);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // Total maintenance cost
  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Maintenance</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {records.length} record{records.length !== 1 ? 's' : ''} — total cost {formatCurrency(totalCost)}
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Log Maintenance
        </button>
      </div>

      {success && <div className="bg-emerald-900/30 border border-emerald-800/50 text-emerald-400 text-sm rounded-xl px-4 py-3">{success}</div>}
      {error && <div className="bg-red-900/30 border border-red-800/50 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="card border-brand-700/40 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-white">{editId ? 'Edit Maintenance Record' : 'Log Maintenance'}</h2>
            <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          {formError && <div className="mb-4 bg-red-900/30 border border-red-800/50 text-red-400 text-sm rounded-xl px-4 py-3">{formError}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Machine *</label>
              <select name="machineId" value={form.machineId} onChange={handleChange} className="input">
                <option value="">Select machine…</option>
                {machines.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} ({m.status})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">Issue Description *</label>
              <input name="issue" value={form.issue} onChange={handleChange} placeholder="Describe the maintenance issue…" className="input" />
            </div>
            <div>
              <label className="label">Cost (PKR) *</label>
              <input type="number" name="cost" value={form.cost} onChange={handleChange} min="0" placeholder="0" className="input" />
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="input">
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="label">Next Maintenance Date</label>
              <input type="date" name="nextMaintenanceDate" value={form.nextMaintenanceDate} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="label">Resolved By</label>
              <input name="resolvedBy" value={form.resolvedBy} onChange={handleChange} placeholder="Technician name…" className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <input name="notes" value={form.notes} onChange={handleChange} placeholder="Additional notes…" className="input" />
            </div>
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving…' : editId ? 'Update' : 'Log Maintenance'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-sm">Loading records…</div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-zinc-600 text-sm">No maintenance records. Click "Log Maintenance" to create one.</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="table-header">Machine</th>
                <th className="table-header">Date</th>
                <th className="table-header">Issue</th>
                <th className="table-header">Cost</th>
                <th className="table-header">Resolved By</th>
                <th className="table-header">Next Service</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {records.map((r) => (
                <tr key={r._id} className="hover:bg-zinc-800/30 transition-colors animate-fade-in">
                  <td className="table-cell font-semibold text-white">{r.machineId?.name}</td>
                  <td className="table-cell font-mono text-xs">{formatDate(r.date)}</td>
                  <td className="table-cell max-w-xs">
                    <p className="truncate">{r.issue}</p>
                    {r.notes && <p className="text-xs text-zinc-600 truncate">{r.notes}</p>}
                  </td>
                  <td className="table-cell font-semibold text-red-400">{formatCurrency(r.cost)}</td>
                  <td className="table-cell">{r.resolvedBy || '—'}</td>
                  <td className="table-cell font-mono text-xs">{formatDate(r.nextMaintenanceDate)}</td>
                  <td className="table-cell"><StatusBadge status={r.status} /></td>
                  <td className="table-cell">
                    <button onClick={() => openEdit(r)} className="text-zinc-400 hover:text-white p-1 transition-colors" title="Edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
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
