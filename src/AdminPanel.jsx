import { useState, useEffect } from 'react';
import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc,
} from 'firebase/firestore';
import { db } from './firebase';

export default function AdminPanel({ onClose }) {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  // Form for adding/editing
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '', price: '', store: '', color: '', size: '', category: 'groceries', imageUrl: '',
  });

  // ── Load products + user count ──
  const loadAll = async () => {
    setLoading(true);
    try {
      const psnap = await getDocs(collection(db, 'products'));
      const plist = psnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(plist);

      const usnap = await getDocs(collection(db, 'users'));
      setUsers(usnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Admin load error:', err);
      setStatus('⚠️ Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ── Reset form ──
  const resetForm = () => {
    setForm({ name: '', price: '', store: '', color: '', size: '', category: 'groceries', imageUrl: '' });
    setEditingId(null);
    setStatus('');
  };

  // ── Add or update product ──
  const saveProduct = async () => {
    setStatus('');
    if (!form.name || !form.price) {
      setStatus('⚠️ Name and price are required');
      return;
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      store: form.store.trim() || 'Unknown',
      color: form.color.trim() || 'n/a',
      size: form.size.trim() || 'n/a',
      category: form.category,
      imageUrl: form.imageUrl.trim(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), payload);
        setStatus('✅ Product updated');
      } else {
        await addDoc(collection(db, 'products'), payload);
        setStatus('✅ Product added');
      }
      resetForm();
      await loadAll();
    } catch (err) {
      console.error('Save error:', err);
      setStatus('❌ Save failed: ' + err.message);
    }
  };

  // ── Edit existing ──
  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name || '',
      price: String(p.price || ''),
      store: p.store || '',
      color: p.color || '',
      size: p.size || '',
      category: p.category || 'groceries',
      imageUrl: p.imageUrl || '',
    });
    setStatus('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Delete ──
  const deleteProduct = async (p) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'products', p.id));
      setStatus(`✅ Deleted "${p.name}"`);
      await loadAll();
    } catch (err) {
      console.error('Delete error:', err);
      setStatus('❌ Delete failed: ' + err.message);
    }
  };

  // ── Styles ──
  const inputStyle = {
    padding: 10, width: '100%', boxSizing: 'border-box',
    border: '1px solid #ddd', borderRadius: 6, fontSize: 14,
    marginTop: 4,
  };

  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 'bold',
    color: '#444', marginTop: 10,
  };

  // Derived stats
  const totalBudget = users.reduce((s, u) => s + (Number(u.budget) || 0), 0);
  const avgBudget = users.length ? Math.round(totalBudget / users.length) : 0;

  return (
    <div style={{
      minHeight: '100vh', background: '#f5f6fa',
      padding: '20px 16px 60px',
      fontFamily: 'system-ui, -apple-system, Arial, sans-serif',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          background: '#2d3436', color: 'white',
          padding: '16px 20px', borderRadius: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 10,
        }}>
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>
            ⚙️ Admin Panel
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)', color: 'white',
              border: 'none', padding: '8px 16px', borderRadius: 8,
              fontSize: 13, fontWeight: 'bold', cursor: 'pointer',
            }}
          >
            ← Back to App
          </button>
        </div>

        {/* Stats */}
        <div style={{
          marginTop: 16, display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
        }}>
          <div style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid #eee' }}>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Products</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#6c5ce7', marginTop: 4 }}>
              {loading ? '—' : products.length}
            </div>
          </div>
          <div style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid #eee' }}>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Users</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#00b894', marginTop: 4 }}>
              {loading ? '—' : users.length}
            </div>
          </div>
          <div style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid #eee' }}>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Avg Budget</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#e17055', marginTop: 4 }}>
              R{avgBudget}
            </div>
          </div>
        </div>

        {/* Add / Edit form */}
        <div style={{
          background: 'white', padding: 20, borderRadius: 12,
          marginTop: 20, border: '1px solid #eee',
        }}>
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 16 }}>
            {editingId ? '✏️ Edit Product' : '➕ Add New Product'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                style={inputStyle}
                placeholder="e.g. White Bread"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Price (R)</label>
              <input
                style={inputStyle}
                type="number"
                placeholder="e.g. 18"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Store</label>
              <input
                style={inputStyle}
                placeholder="e.g. Shoprite"
                value={form.store}
                onChange={e => setForm({ ...form, store: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Colour</label>
              <input
                style={inputStyle}
                placeholder="e.g. white"
                value={form.color}
                onChange={e => setForm({ ...form, color: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Size</label>
              <input
                style={inputStyle}
                placeholder="e.g. 700g"
                value={form.size}
                onChange={e => setForm({ ...form, size: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                style={inputStyle}
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                <option value="groceries">Groceries</option>
                <option value="toiletries">Toiletries</option>
                <option value="clothing">Clothing</option>
                <option value="stationery">Stationery</option>
                <option value="electronics">Electronics</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Image URL (optional)</label>
              <input
                style={inputStyle}
                placeholder="https://example.com/image.jpg"
                value={form.imageUrl}
                onChange={e => setForm({ ...form, imageUrl: e.target.value })}
              />
            </div>
          </div>

          {status && (
            <div style={{
              marginTop: 12, padding: 10,
              background: status.startsWith('✅') ? '#d4edda'
                        : status.startsWith('⚠️') ? '#fff3cd' : '#ffe5e5',
              color: status.startsWith('✅') ? '#155724'
                   : status.startsWith('⚠️') ? '#856404' : '#c0392b',
              borderRadius: 6, fontSize: 13,
            }}>
              {status}
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={saveProduct}
              style={{
                background: editingId ? '#e17055' : '#00b894',
                color: 'white', border: 'none',
                padding: '10px 20px', borderRadius: 8,
                fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
              }}
            >
              {editingId ? '💾 Save Changes' : '➕ Add Product'}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                style={{
                  background: 'white', color: '#666',
                  border: '1px solid #ddd',
                  padding: '10px 20px', borderRadius: 8,
                  fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Product list */}
        <div style={{
          background: 'white', padding: 20, borderRadius: 12,
          marginTop: 20, border: '1px solid #eee',
        }}>
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 16 }}>
            📦 All Products ({products.length})
          </h3>

          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>Loading...</div>
          ) : products.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>
              No products yet. Add one above.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%', borderCollapse: 'collapse', fontSize: 13,
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    <th style={{ textAlign: 'left', padding: 8, color: '#666', width: 50 }}>Img</th>
                    <th style={{ textAlign: 'left', padding: 8, color: '#666' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: 8, color: '#666' }}>Price</th>
                    <th style={{ textAlign: 'left', padding: 8, color: '#666' }}>Store</th>
                    <th style={{ textAlign: 'left', padding: 8, color: '#666' }}>Category</th>
                    <th style={{ textAlign: 'right', padding: 8, color: '#666' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: 8 }}>
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            loading="lazy"
                            onError={(e) => { e.target.style.display = 'none'; }}
                            style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }}
                          />
                        ) : (
                          <span style={{ color: '#ccc', fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: 8 }}>{p.name}</td>
                      <td style={{ padding: 8 }}>R{p.price}</td>
                      <td style={{ padding: 8, color: '#888' }}>{p.store}</td>
                      <td style={{ padding: 8, color: '#888' }}>{p.category}</td>
                      <td style={{ padding: 8, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => startEdit(p)}
                          style={{
                            background: '#0984e3', color: 'white',
                            border: 'none', padding: '6px 10px',
                            borderRadius: 6, fontSize: 12,
                            cursor: 'pointer', marginRight: 6,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProduct(p)}
                          style={{
                            background: '#d63031', color: 'white',
                            border: 'none', padding: '6px 10px',
                            borderRadius: 6, fontSize: 12, cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}