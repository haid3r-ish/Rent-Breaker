import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = { name: '', phone: '', cnic: '', address: '', email: '' };

export default function Customers() {
  const { isAdmin } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);

  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/customers');
      setCustomers(data.data);
    } catch {
      setError('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.cnic.includes(search)
  );

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

  const openEdit = (c) => {
    setEditId(c._id);
    setForm({ name: c.name, phone: c.phone, cnic: c.cnic, address: c.address, email: c.email || '' });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.cnic || !form.address) {
      setFormError('Name, phone, CNIC and address are required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editId) {
        await api.put(`/customers/${editId}`, form);
        setSuccess('Customer updated.');
      } else {
        await api.post('/customers', form);
        setSuccess('Customer added.');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save customer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      setSuccess('Customer deactivated.');
      fetchCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate customer.');
      setTimeout(() => setError(''), 4000);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Customers</h1>
          <p className="text-zinc-500 text-sm mt-1">{customers.length} registered customer{customers.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search name, phone, CNIC…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-64"
            />
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Customer
          </button>
        </div>
      </div>

      {success && <div className="bg-emerald-900/30 border border-emerald-800/50 text-emerald-400 text-sm rounded-xl px-4 py-3">{success}</div>}
      {error && <div className="bg-red-900/30 border border-red-800/50 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="card border-brand-700/40 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-white">{editId ? 'Edit Customer' : 'Add New Customer'}</h2>
            <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          {formError && <div className="mb-4 bg-red-900/30 border border-red-800/50 text-red-400 text-sm rounded-xl px-4 py-3">{formError}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Muhammad Ali" className="input" />
            </div>
            <div>
              <label className="label">Phone Number *</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="03001234567" className="input" />
            </div>
            <div>
              <label className="label">CNIC * (XXXXX-XXXXXXX-X)</label>
              <input name="cnic" value={form.cnic} onChange={handleChange} placeholder="35202-1234567-9" className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="customer@email.com" className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">Address *</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="House #12, Block B, Lahore" className="input" />
            </div>
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving…' : editId ? 'Update' : 'Add Customer'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-sm">Loading customers…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-zinc-600 text-sm">
            {search ? 'No customers match your search.' : 'No customers yet. Click "Add Customer" to start.'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Phone</th>
                <th className="table-header">CNIC</th>
                <th className="table-header">Address</th>
                <th className="table-header">Email</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((c) => (
                <tr key={c._id} className="hover:bg-zinc-800/30 transition-colors animate-fade-in">
                  <td className="table-cell font-semibold text-white">{c.name}</td>
                  <td className="table-cell font-mono text-xs">{c.phone}</td>
                  <td className="table-cell font-mono text-xs">{c.cnic}</td>
                  <td className="table-cell max-w-xs truncate">{c.address}</td>
                  <td className="table-cell text-zinc-500">{c.email || '—'}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-zinc-400 hover:text-white p-1 transition-colors" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(c._id)} className="text-zinc-600 hover:text-red-400 p-1 transition-colors" title="Deactivate">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <polyline points="3,6 5,6 21,6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                          </svg>
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
