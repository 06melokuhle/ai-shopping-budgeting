import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import Auth from './Auth';
import Landing from './Landing';
import AdminPanel from './AdminPanel';

// ─────────────────────────────────────────────
// Gemini
// ─────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────
const DEFAULT_PREFS = {
  color: '',
  size: '',
  radius: '5',
  shipping: 'cheapest',
  favStores: '',
  favStyles: '',
  hobbies: '',
};

const CATEGORIES = ['all', 'groceries', 'toiletries', 'clothing', 'stationery', 'electronics'];
const MAX_HISTORY = 20;

// ─────────────────────────────────────────────
// Rule-based fallback
// ─────────────────────────────────────────────
function scoreProduct(product, remaining, prefs) {
  let score = 0;
  const reasons = [];

  const ratio = product.price / Math.max(remaining, 1);
  if (product.price > remaining) {
    score -= 20;
    reasons.push('⚠️ Over budget');
  } else if (ratio < 0.1) {
    score += 50;
    reasons.push('Fits comfortably in budget');
  } else if (ratio < 0.3) {
    score += 35;
    reasons.push('Good value for your budget');
  } else if (ratio < 0.6) {
    score += 20;
    reasons.push('Takes a chunk of your budget');
  } else {
    score += 5;
    reasons.push('Uses most of your remaining budget');
  }

  const prefColor = (prefs?.color || '').toLowerCase();
  if (prefColor && product.color && product.color.toLowerCase().includes(prefColor)) {
    score += 20;
    reasons.push('Matches your colour preference');
  }

  const prefSize = (prefs?.size || '').toLowerCase();
  if (prefSize && product.size && product.size.toLowerCase().includes(prefSize)) {
    score += 15;
    reasons.push('Matches your size');
  }

  const favStores = prefs?.favStores || '';
  if (favStores) {
    const stores = favStores.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (stores.some(s => product.store.toLowerCase().includes(s))) {
      score += 15;
      reasons.push('From a favourite store');
    }
  }

  const finalScore = Math.max(0, Math.min(100, score));
  return {
    ...product,
    aiScore: finalScore,
    aiReason: reasons.length ? reasons.join(' • ') : 'Standard match',
  };
}

export default function App() {
  // Auth
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authView, setAuthView] = useState('landing');
  const [authRole, setAuthRole] = useState('student');
  const [roleError, setRoleError] = useState('');

  // Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Core data
  const [budget, setBudget] = useState(1000);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);

  // Manual add
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('ai');
  const [maxPrice, setMaxPrice] = useState('');

  // Preferences
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({ ...DEFAULT_PREFS });

  // AI
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // DB
  const [dbLoading, setDbLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState('Loading from cloud...');

  // Toast
  const [toast, setToast] = useState('');

  const userId = user?.uid;

  // ── Toast ──
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  // ── Auth listener ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthChecked(true);

      if (u) {
        try {
          const token = await u.getIdTokenResult();
          const hasAdminClaim = !!token.claims.admin;
          setIsAdmin(hasAdminClaim);

          if (authRole === 'admin' && !hasAdminClaim) {
            setRoleError('This account is not an admin.');
            await signOut(auth);
          } else {
            setRoleError('');
          }
        } catch (err) {
          console.error('Claim check error:', err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        setDbLoading(false);
      }
    });
    return () => unsub();
  }, [authRole]);

  // ── Load products ──
  useEffect(() => {
    async function loadProducts() {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setProducts(list);
        console.log(`✅ Loaded ${list.length} products`);
      } catch (err) {
        console.error('Products load error:', err);
      }
    }
    loadProducts();
  }, []);

  // ── Load user data ──
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    async function load() {
      setDbLoading(true);
      setDbStatus('Loading from cloud...');
      try {
        const ref = doc(db, 'users', userId);
        const snap = await getDoc(ref);
        if (cancelled) return;
        if (snap.exists()) {
          const data = snap.data() || {};
          if (typeof data.budget === 'number') setBudget(data.budget);
          if (Array.isArray(data.items)) setItems(data.items);
          if (Array.isArray(data.history)) setHistory(data.history);
          if (data.prefs && typeof data.prefs === 'object') {
            setPrefs({ ...DEFAULT_PREFS, ...data.prefs });
          } else {
            setPrefs({ ...DEFAULT_PREFS });
          }
          setDbStatus('');
        } else {
          setBudget(1000); setItems([]); setHistory([]);
          setPrefs({ ...DEFAULT_PREFS });
          setDbStatus('🆕 Welcome — data saves automatically');
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Firestore load error:', err);
        setDbStatus('⚠️ Cloud unavailable — using local');
      } finally {
        if (!cancelled) setDbLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  // ── Save user data ──
  useEffect(() => {
    if (dbLoading || !userId) return;
    const timer = setTimeout(async () => {
      try {
        const ref = doc(db, 'users', userId);
        await setDoc(ref, { budget, items, prefs, history, updatedAt: Date.now() }, { merge: true });
      } catch (err) {
        console.error('Firestore save error:', err);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [budget, items, prefs, history, userId, dbLoading]);

  // ── History ──
  const pushHistory = (event) => {
    setHistory(prev => [{ ...event, ts: Date.now() }, ...prev].slice(0, MAX_HISTORY));
  };
  const trackView = (product) => pushHistory({ type: 'view', id: product.id, name: product.name });
  const trackSearch = (query) => {
    if (!query || query.trim().length < 2) return;
    pushHistory({ type: 'search', query: query.trim() });
  };
  const clearHistory = () => {
    if (confirm('Clear all shopping history?')) setHistory([]);
  };

  const recentViews = [];
  const seenIds = new Set();
  for (const h of history) {
    if (h.type === 'view' && !seenIds.has(h.id)) {
      seenIds.add(h.id); recentViews.push(h);
      if (recentViews.length >= 5) break;
    }
  }
  const recentSearches = [];
  const seenQueries = new Set();
  for (const h of history) {
    if (h.type === 'search' && !seenQueries.has(h.query)) {
      seenQueries.add(h.query); recentSearches.push(h);
      if (recentSearches.length >= 5) break;
    }
  }

  // ── Derived ──
  const total = items.reduce((s, i) => s + Number(i.price), 0);
  const remaining = budget - total;

  // ── Filtering ──
  let filtered = products;
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.store.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }
  if (category !== 'all') filtered = filtered.filter(p => p.category === category);
  if (maxPrice && Number(maxPrice) > 0) filtered = filtered.filter(p => p.price <= Number(maxPrice));

  // ── Ranking ──
  if (aiResults && aiResults.length) {
    const aiMap = new Map(aiResults.map(r => [r.productId, r]));
    filtered = filtered.filter(p => aiMap.has(p.id)).map(p => {
      const r = aiMap.get(p.id);
      return { ...p, aiScore: r.score, aiReason: r.reason };
    });
  } else {
    filtered = filtered.map(p => scoreProduct(p, remaining, prefs));
  }

  if (sortBy === 'ai') filtered = [...filtered].sort((a, b) => b.aiScore - a.aiScore);
  else if (sortBy === 'cheapest') filtered = [...filtered].sort((a, b) => a.price - b.price);
  else filtered = [...filtered].sort((a, b) => b.price - a.price);

  // ── AI ──
  const rankWithAI = async () => {
    setAiLoading(true);
    setAiError('');
    const safePrefs = prefs || DEFAULT_PREFS;
    const candidates = filtered.slice(0, 15);
    const historySummary = history.slice(0, 10).map(h =>
      h.type === 'view' ? `viewed "${h.name}"` : `searched "${h.query}"`
    ).join(', ') || 'no history yet';

    const prompt = `
You are a budget-first shopping assistant for a South African university student on an NSFAS allowance.

Student context:
- Remaining budget this month: R${remaining}
- Preferred colour: ${safePrefs.color || 'none specified'}
- Preferred size: ${safePrefs.size || 'none specified'}
- Favourite stores: ${safePrefs.favStores || 'none specified'}
- Shipping preference: ${safePrefs.shipping}
- Recent activity: ${historySummary}

Candidate products (JSON):
${JSON.stringify(candidates.map(p => ({
  id: p.id, name: p.name, price: p.price, store: p.store,
  color: p.color, size: p.size, category: p.category
})))}

Rank the top products. Return ONLY valid JSON, no markdown:
[{ "productId": 13, "score": 85, "reason": "One short sentence." }]

Rules:
- score is 0 to 100
- Only products student can afford with remaining budget R${remaining}
- Prefer products matching colour/size/favourite stores
- If recent activity mentions similar products, boost those
- Reasons must mention budget fit, colour, size, or store
- Do not invent products not in the list
`;

    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) throw new Error('Bad AI response shape');
        setAiResults(parsed);
        setAiLoading(false);
        showToast('✅ Ranked by Gemini AI');
        return;
      } catch (err) {
        lastError = err;
        console.warn(`AI attempt ${attempt} failed:`, err.message || err);
        if (attempt < 3) {
          setAiError(`AI is busy — retrying (${attempt}/3)...`);
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    }
    console.error('Gemini error after 3 tries:', lastError);
    setAiError('AI unavailable right now — showing smart fallback. Try again in a moment.');
    setAiResults(null);
    setAiLoading(false);
  };

  const clearAI = () => { setAiResults(null); setAiError(''); };

  // ── Handlers ──
  const addItem = () => {
    if (!name || !price) return;
    setItems([...items, { id: Date.now(), name, price: Number(price) }]);
    setName(''); setPrice('');
    showToast(`✓ Added "${name}"`);
  };
  const removeItem = (id) => setItems(items.filter(i => i.id !== id));
  const addProductToList = (product) => {
    setItems([...items, { id: Date.now(), name: product.name, price: product.price }]);
    trackView(product);
    showToast(`✓ Added "${product.name}"`);
  };
  const updatePref = (field, value) => {
    setPrefs({ ...(prefs || DEFAULT_PREFS), [field]: value });
  };
  const getSuggestion = () => {
    if (remaining < 0) {
      const priciest = [...items].sort((a, b) => b.price - a.price)[0];
      return `⚠️ Over budget by R${Math.abs(remaining)}! Remove "${priciest?.name}" to save R${priciest?.price}.`;
    }
    if (remaining < budget * 0.2) {
      return `🤖 Alert: Only R${remaining} left (${Math.round((remaining / budget) * 100)}%). Buy essentials only.`;
    }
    return `🤖 Tip: R${remaining} remaining. Room for ~${Math.floor(remaining / 50)} more small items.`;
  };

  // ── Styles ──
  const inputStyle = {
    padding: 12, width: '100%', boxSizing: 'border-box',
    border: '1px solid #ddd', borderRadius: 8, fontSize: 16,
    marginTop: 6, WebkitAppearance: 'none',
  };
  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 'bold',
    color: '#444', marginTop: 14,
  };
  const primaryButton = {
    background: 'linear-gradient(90deg, #6c5ce7, #a29bfe)',
    color: 'white', border: 'none', padding: '14px 18px',
    borderRadius: 10, fontSize: 15, fontWeight: 'bold',
    cursor: 'pointer', width: '100%', minHeight: 48,
    boxShadow: '0 2px 6px rgba(108,92,231,0.3)',
  };
  const outlineButton = {
    background: 'white', color: '#6c5ce7',
    border: '2px solid #6c5ce7', padding: '12px 16px',
    borderRadius: 10, fontSize: 14, fontWeight: 'bold',
    cursor: 'pointer', width: '100%', minHeight: 48,
  };

  // ─────────────────────────────────────────────
  // RENDER GATES
  // ─────────────────────────────────────────────

  if (showAdmin && isAdmin) {
    return <AdminPanel onClose={() => setShowAdmin(false)} />;
  }

  if (!authChecked) {
    return (
      <div style={{
        minHeight: '100vh', background: '#f5f6fa',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'system-ui, Arial, sans-serif',
      }}>
        <div style={{ color: '#6c5ce7', fontWeight: 'bold' }}>Checking session...</div>
      </div>
    );
  }

  if (!user) {
    if (authView === 'landing') {
      return (
        <Landing
          onStudent={() => { setAuthRole('student'); setAuthView('auth'); }}
          onAdmin={() => { setAuthRole('admin'); setAuthView('auth'); }}
        />
      );
    }
    return (
      <div>
        {roleError && (
          <div style={{
            background: '#ffe5e5', color: '#c0392b',
            padding: 12, textAlign: 'center',
            fontSize: 13, fontWeight: 'bold',
          }}>
            ⚠️ {roleError}
          </div>
        )}
        <Auth role={authRole} />
        <div style={{ textAlign: 'center', padding: 16 }}>
          <button
            onClick={() => {
              setAuthView('landing');
              setAuthRole('student');
              setRoleError('');
            }}
            style={{
              background: 'none', border: 'none',
              color: '#6c5ce7', fontSize: 12,
              fontWeight: 'bold', cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            ← Back to home
          </button>
        </div>
      </div>
    );
  }

  if (dbLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#f5f6fa',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'system-ui, Arial, sans-serif', padding: 20,
      }}>
        <div style={{
          background: 'white', padding: 30, borderRadius: 14,
          textAlign: 'center', width: '100%', maxWidth: 340,
        }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>☁️</div>
          <div style={{ fontWeight: 'bold', color: '#333' }}>Loading your data...</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>Fetching from cloud</div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // MAIN APP
  // ─────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#f5f6fa',
      padding: '16px 12px 40px',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          background: '#6c5ce7', color: 'white',
          padding: '16px 18px', borderRadius: 14,
          display: 'flex', flexWrap: 'wrap',
          justifyContent: 'space-between', alignItems: 'center', gap: 10,
        }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', lineHeight: 1.2 }}>
            🛒 AI Shopping for Budgeting
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {isAdmin && (
              <button
                onClick={() => setShowAdmin(true)}
                style={{
                  background: 'rgba(255,255,255,0.3)', color: 'white',
                  border: 'none', padding: '8px 12px', borderRadius: 8,
                  fontSize: 12, fontWeight: 'bold', cursor: 'pointer',
                }}
              >
                ⚙️ Admin
              </button>
            )}
            <button
              onClick={() => {
                signOut(auth);
                setAuthView('landing');
                setAuthRole('student');
              }}
              style={{
                background: 'rgba(255,255,255,0.2)', color: 'white',
                border: 'none', padding: '8px 12px', borderRadius: 8,
                fontSize: 12, fontWeight: 'bold', cursor: 'pointer',
              }}
            >
              Log out
            </button>
          </div>
        </div>

        <div style={{ marginTop: 8, fontSize: 11, color: '#777', textAlign: 'right' }}>
          Signed in as {user?.email}
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: '#777', textAlign: 'center' }}>
          {dbStatus}
        </div>

        {/* Search */}
        <div style={{ marginTop: 14 }}>
          <input
            type="text"
            placeholder="🔍 Search products... e.g. bread, hoodie, soap"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onBlur={() => trackSearch(search)}
            onKeyDown={e => e.key === 'Enter' && trackSearch(search)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: 14, border: '2px solid #6c5ce7',
              borderRadius: 12, fontSize: 16,
              background: 'white', WebkitAppearance: 'none',
            }}
          />
        </div>

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#777' }}>Recent:</span>
            {recentSearches.map(s => (
              <button
                key={s.ts}
                onClick={() => setSearch(s.query)}
                style={{
                  background: '#eef1ff', color: '#6c5ce7',
                  border: 'none', padding: '6px 12px',
                  borderRadius: 14, fontSize: 12, cursor: 'pointer',
                  minHeight: 32,
                }}
              >
                {s.query}
              </button>
            ))}
          </div>
        )}

        {/* Category pills */}
        <div style={{
          marginTop: 14, display: 'flex', gap: 8,
          overflowX: 'auto', paddingBottom: 4,
          WebkitOverflowScrolling: 'touch',
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '8px 16px', borderRadius: 20,
                border: '1px solid #6c5ce7',
                background: category === cat ? '#6c5ce7' : 'white',
                color: category === cat ? 'white' : '#6c5ce7',
                fontSize: 13, fontWeight: 'bold', cursor: 'pointer',
                textTransform: 'capitalize', whiteSpace: 'nowrap',
                flexShrink: 0, minHeight: 36,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort + Max price */}
        <div style={{
          marginTop: 14, display: 'grid',
          gridTemplateColumns: '1fr 140px', gap: 10,
        }}>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: 12, border: '1px solid #ddd',
              borderRadius: 8, fontSize: 14, background: 'white',
              WebkitAppearance: 'none', minHeight: 44,
            }}
          >
            <option value="ai">🧠 AI Best Match</option>
            <option value="cheapest">💰 Cheapest first</option>
            <option value="priciest">💎 Most expensive first</option>
          </select>
          <input
            type="number"
            placeholder="Max R"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            style={{
              padding: 12, border: '1px solid #ddd',
              borderRadius: 8, fontSize: 14, background: 'white',
              boxSizing: 'border-box', minHeight: 44,
            }}
          />
        </div>

        {/* Rank with AI */}
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button
            onClick={rankWithAI}
            disabled={aiLoading}
            style={{
              flex: 1,
              background: aiLoading ? '#aaa' : 'linear-gradient(90deg, #6c5ce7, #a29bfe)',
              color: 'white', border: 'none',
              padding: '14px 16px', borderRadius: 10,
              fontSize: 15, fontWeight: 'bold',
              cursor: aiLoading ? 'wait' : 'pointer',
              boxShadow: '0 2px 6px rgba(108,92,231,0.3)',
              minHeight: 48,
            }}
          >
            {aiLoading ? '🧠 AI is thinking...' : '🧠 Rank with AI'}
          </button>
          {aiResults && (
            <button
              onClick={clearAI}
              style={{
                background: 'white', color: '#6c5ce7',
                border: '1px solid #6c5ce7',
                padding: '14px 16px', borderRadius: 10,
                fontSize: 13, fontWeight: 'bold', cursor: 'pointer',
                minHeight: 48,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {aiError && (
          <div style={{ marginTop: 10, padding: 12, background: '#fff3cd', color: '#856404', borderRadius: 8, fontSize: 13 }}>
            {aiError}
          </div>
        )}
        {aiResults && (
          <div style={{ marginTop: 10, padding: 12, background: '#d4edda', color: '#155724', borderRadius: 8, fontSize: 13 }}>
            ✅ Ranked by Gemini AI
          </div>
        )}

        {/* ⭐ BUDGET CARD — MOVED UP HERE */}
        <div style={{
          background: 'white', padding: 20, borderRadius: 12,
          marginTop: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <h3 style={{ margin: 0, marginBottom: 12, fontSize: 18 }}>My Budget: R{budget}</h3>
          <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} style={inputStyle} />
          <p style={{ marginTop: 15, marginBottom: 15, fontSize: 15 }}>
            Total Spent: <b>R{total}</b> | Remaining:{' '}
            <b style={{ color: remaining < 0 ? 'red' : 'green' }}>R{remaining}</b>
          </p>
          <div style={{ background: '#eef1ff', padding: 14, borderRadius: 10, fontSize: 14, lineHeight: 1.5, color: '#333' }}>
            {getSuggestion()}
          </div>
          <button
            onClick={() => setShowPrefs(!showPrefs)}
            style={{ ...(showPrefs ? primaryButton : outlineButton), marginTop: 15 }}
          >
            {showPrefs ? '✕ Close Preferences' : '⚙️ Set Preferences'}
          </button>
        </div>

        {/* Preferences panel — right below budget */}
        {showPrefs && (
          <div style={{ background: 'white', padding: 20, borderRadius: 12, marginTop: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: 0, marginBottom: 5, fontSize: 18 }}>Shopping Preferences</h3>
            <p style={{ margin: 0, marginBottom: 15, fontSize: 13, color: '#777' }}>
              🧠 Gemini uses these to rank products for you.
            </p>

            <label style={labelStyle}>Preferred Colour</label>
            <input type="text" placeholder="e.g. black, navy" value={prefs.color} onChange={e => updatePref('color', e.target.value)} style={inputStyle} />

            <label style={labelStyle}>Preferred Size</label>
            <input type="text" placeholder="e.g. M, L, 42" value={prefs.size} onChange={e => updatePref('size', e.target.value)} style={inputStyle} />

            <label style={labelStyle}>Location Radius (km)</label>
            <input type="number" placeholder="e.g. 5" value={prefs.radius} onChange={e => updatePref('radius', e.target.value)} style={inputStyle} />

            <label style={labelStyle}>Shipping Preference</label>
            <select value={prefs.shipping} onChange={e => updatePref('shipping', e.target.value)} style={inputStyle}>
              <option value="cheapest">Cheapest</option>
              <option value="fastest">Fastest</option>
              <option value="nearest">Nearest store</option>
            </select>

            <label style={labelStyle}>Favourite Stores (comma separated)</label>
            <input type="text" placeholder="e.g. Shoprite, Takealot" value={prefs.favStores} onChange={e => updatePref('favStores', e.target.value)} style={inputStyle} />

            <label style={labelStyle}>Favourite Styles</label>
            <input type="text" placeholder="e.g. casual, formal" value={prefs.favStyles} onChange={e => updatePref('favStyles', e.target.value)} style={inputStyle} />

            <label style={labelStyle}>Hobbies & Interests</label>
            <input type="text" placeholder="e.g. gaming, cooking" value={prefs.hobbies} onChange={e => updatePref('hobbies', e.target.value)} style={inputStyle} />

            <button
              onClick={() => setShowPrefs(false)}
              style={{ ...primaryButton, marginTop: 20, background: '#00b894' }}
            >
              ✓ Save Preferences
            </button>
          </div>
        )}

        {/* Recently viewed */}
        {recentViews.length > 0 && (
          <div style={{ marginTop: 16, background: 'white', padding: 16, borderRadius: 12, border: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>🕒 Recently Viewed</div>
              <button
                onClick={clearHistory}
                style={{ background: 'none', border: 'none', color: '#999', fontSize: 11, cursor: 'pointer', padding: 4 }}
              >
                Clear history
              </button>
            </div>
            {recentViews.map(v => (
              <div key={v.ts} style={{ fontSize: 13, color: '#555', padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                {v.name}
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, color: '#777', marginBottom: 8 }}>
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
            {sortBy === 'ai' && (aiResults ? ' • ranked by Gemini AI' : ' • ranked by rules')}
          </div>

          {filtered.length === 0 ? (
            <div style={{ background: 'white', padding: 24, borderRadius: 12, textAlign: 'center', color: '#888', fontSize: 14 }}>
              No products match your filters
            </div>
          ) : (
            filtered.map((p, idx) => {
              const fitsBudget = p.price <= remaining;
              const isTop = sortBy === 'ai' && idx === 0 && p.aiScore > 0;
              return (
                <div
                  key={p.id}
                  onClick={() => trackView(p)}
                  style={{
                    background: 'white', padding: '14px 16px', marginTop: 10,
                    borderRadius: 12,
                    border: isTop ? '2px solid #6c5ce7' : '1px solid #eee',
                    cursor: 'pointer',
                  }}
                >
                  {isTop && (
                    <div style={{
                      display: 'inline-block', background: '#6c5ce7', color: 'white',
                      fontSize: 11, fontWeight: 'bold', padding: '3px 8px',
                      borderRadius: 4, marginBottom: 8,
                    }}>
                      🏆 BEST MATCH
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                        style={{
                          width: 72, height: 72, objectFit: 'cover',
                          borderRadius: 8, flexShrink: 0, background: '#f0f0f0',
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 15, lineHeight: 1.3 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                        {p.store} • {p.color} • {p.size}
                      </div>
                      <div style={{ fontSize: 12, color: '#6c5ce7', marginTop: 8, lineHeight: 1.4 }}>
                        {aiResults ? '🧠 ' : '📊 '}{p.aiReason}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 15 }}>R{p.price}</div>
                      {sortBy === 'ai' && (
                        <div style={{ fontSize: 11, color: '#6c5ce7', marginTop: 2 }}>score {p.aiScore}</div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); addProductToList(p); }}
                        disabled={!fitsBudget}
                        style={{
                          marginTop: 8,
                          background: fitsBudget ? '#00b894' : '#ccc',
                          color: 'white', border: 'none',
                          padding: '8px 14px', borderRadius: 8,
                          fontSize: 12, fontWeight: 'bold',
                          cursor: fitsBudget ? 'pointer' : 'not-allowed',
                          minHeight: 36,
                        }}
                      >
                        {fitsBudget ? '+ Add' : 'Over budget'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Manual add */}
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 100px auto', gap: 8 }}>
          <input placeholder="Item name" value={name} onChange={e => setName(e.target.value)} style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 16, WebkitAppearance: 'none', minWidth: 0 }} />
          <input placeholder="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 16, WebkitAppearance: 'none', minWidth: 0 }} />
          <button onClick={addItem} style={{ background: '#00b894', color: 'white', border: 'none', padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', minHeight: 48 }}>
            Add
          </button>
        </div>

        {/* Items list */}
        <div style={{ marginTop: 20 }}>
          {items.map(it => (
            <div key={it.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'white', border: '1px solid #eee',
              padding: '14px 16px', marginTop: 8, borderRadius: 10, fontSize: 15,
            }}>
              <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>{it.name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                R{it.price}
                <button onClick={() => removeItem(it.id)} style={{
                  color: 'red', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontSize: 18, fontWeight: 'bold',
                  padding: 4, minWidth: 32, minHeight: 32,
                }}>
                  ✕
                </button>
              </span>
            </div>
          ))}
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%',
          transform: 'translateX(-50%)',
          background: '#2d3436', color: 'white',
          padding: '12px 20px', borderRadius: 10,
          fontSize: 14, fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          zIndex: 9999, maxWidth: '90vw', textAlign: 'center',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}