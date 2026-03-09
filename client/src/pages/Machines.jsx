import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = { name: '', capacity: '', rentalPricePerDay: '', location: '', description: '', status: 'Available' };

function StatusBadge({ status }) {
  const map = { Available: 'badge-green', Rented: 'badge-orange', Maintenance: 'badge-red' };
  return <span className={map[status] || 'badge-zinc'}>{status}</span>;
}

export default function Machines() {
  const { isAdmin } = useAuth();

  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editId, setEditId] = useState(null);

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/machines');
      setMachines(data.data);
    } catch {
      setError('Failed to load machines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMachines(); }, []);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (machine) => {
    setEditId(machine._id);
    setForm({
      name: machine.name,
      capacity: machine.capacity,
      rentalPricePerDay: machine.rentalPricePerDay,
      location: machine.location,
      description: machine.description || '',
      status: machine.status,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.capacity || !form.rentalPricePerDay || !form.location) {
      setFormError('Name, capacity, price, and location are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editId) {
        await api.put(`/machines/${editId}`, form);
        setSuccess('Machine updated successfully.');
      } else {
        await api.post('/machines', form);
        setSuccess('Machine added successfully.');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      fetchMachines();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save machine.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this machine? This action cannot be undone.')) return;
    try {
      await api.delete(`/machines/${id}`);
      setSuccess('Machine deleted.');
      fetchMachines();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete machine.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Machines</h1>
          <p className="text-zinc-500 text-sm mt-1">{machines.length} machine{machines.length !== 1 ? 's' : ''} in fleet</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Machine
          </button>
        )}
      </div>

      {success && <div className="bg-emerald-900/30 border border-emerald-800/50 text-emerald-400 text-sm rounded-xl px-4 py-3">{success}</div>}
      {error && <div className="bg-red-900/30 border border-red-800/50 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card border-brand-700/40 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-white">{editId ? 'Edit Machine' : 'Add New Machine'}</h2>
            <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {formError && (
            <div className="mb-4 bg-red-900/30 border border-red-800/50 text-red-400 text-sm rounded-xl px-4 py-3">{formError}</div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Machine Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Breaker 5T-Heavy" className="input" />
            </div>
            <div>
              <label className="label">Capacity *</label>
              <input name="capacity" value={form.capacity} onChange={handleChange} placeholder="e.g. 5 Ton" className="input" />
            </div>
            <div>
              <label className="label">Rental Price / Day (PKR) *</label>
              <input name="rentalPricePerDay" type="number" min="0" value={form.rentalPricePerDay} onChange={handleChange} placeholder="5000" className="input" />
            </div>
            <div>
              <label className="label">Location *</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Warehouse A" className="input" />
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="input">
                <option value="Available">Available</option>
                <option value="Rented">Rented</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <input name="description" value={form.description} onChange={handleChange} placeholder="Optional notes…" className="input" />
            </div>
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Saving…' : editId ? 'Update Machine' : 'Add Machine'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-sm">Loading machines…</div>
        ) : machines.length === 0 ? (
          <div className="py-16 text-center text-zinc-600 text-sm">
            No machines found.{isAdmin && ' Click "Add Machine" to get started.'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Capacity</th>
                <th className="table-header">Price / Day</th>
                <th className="table-header">Location</th>
                <th className="table-header">Status</th>
                {isAdmin && <th className="table-header">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {machines.map((m) => (
                <tr key={m._id} className="hover:bg-zinc-800/30 transition-colors animate-fade-in">
                  <td className="table-cell font-semibold text-white">{m.name}</td>
                  <td className="table-cell">{m.capacity}</td>
                  <td className="table-cell font-mono text-xs">{formatCurrency(m.rentalPricePerDay)}</td>
                  <td className="table-cell">{m.location}</td>
                  <td className="table-cell"><StatusBadge status={m.status} /></td>
                  {isAdmin && (
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(m)}
                          className="text-zinc-400 hover:text-white transition-colors p-1"
                          title="Edit"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(m._id)}
                          className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                          title="Delete"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <polyline points="3,6 5,6 21,6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
