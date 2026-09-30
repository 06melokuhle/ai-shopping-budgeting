import { useState } from 'react';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// ─────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const studentNoRegex = /^\d{8}$/;
const cellRegex = /^0\d{9}$/;

function passwordChecks(pw) {
  return {
    length: pw.length >= 6,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(pw),
  };
}

function isPasswordValid(pw) {
  const c = passwordChecks(pw);
  return c.length && c.upper && c.lower && c.number && c.special;
}

function Rule({ ok, text }) {
  return (
    <div style={{
      fontSize: 12,
      color: ok ? '#00b894' : '#999',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginTop: 3,
    }}>
      <span style={{ fontWeight: 'bold' }}>{ok ? '✓' : '○'}</span>
      <span>{text}</span>
    </div>
  );
}

export default function Auth({ role = 'student' }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [studentNo, setStudentNo] = useState('');
  const [email, setEmail] = useState('');
  const [cell, setCell] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Live validation
  const emailOk = emailRegex.test(email);
  const studentNoOk = studentNoRegex.test(studentNo);
  const cellOk = cellRegex.test(cell);
  const pwRules = passwordChecks(password);
  const pwOk = isPasswordValid(password);
  const confirmOk = confirm.length > 0 && confirm === password;

  const resetForm = () => {
    setStudentNo('');
    setEmail('');
    setCell('');
    setPassword('');
    setConfirm('');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  // ── Main submit handler ──
  const submit = async () => {
    setError('');
    setSuccess('');

    // ── FORGOT PASSWORD MODE ──
    if (mode === 'forgot') {
      if (!email) {
        setError('Please enter your email.');
        return;
      }
      if (!emailOk) {
        setError('That email address is invalid.');
        return;
      }
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccess('✅ Reset email sent! Check your inbox (and spam folder). Click the link in the email to set a new password.');
      } catch (err) {
        const code = err.code || '';
        if (code.includes('user-not-found')) {
          setError('No account with that email. Try signing up.');
        } else if (code.includes('too-many-requests')) {
          setError('Too many requests. Try again in a few minutes.');
        } else {
          setError('Could not send reset email. ' + (err.message || ''));
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── LOGIN MODE ──
    if (mode === 'login') {
      if (!email || !password) {
        setError('Please enter your email and password.');
        return;
      }
      if (!emailOk) {
        setError('That email address is invalid.');
        return;
      }
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (err) {
        const code = err.code || '';
        if (code.includes('invalid-credential') || code.includes('wrong-password')) {
          setError('Wrong email or password.');
        } else if (code.includes('user-not-found')) {
          setError('No account with that email. Please sign up.');
        } else if (code.includes('too-many-requests')) {
          setError('Too many attempts. Please try again later.');
        } else {
          setError('Login failed. ' + (err.message || ''));
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── SIGNUP MODE ──
    if (!studentNoOk) { setError('Student number must be exactly 8 digits.'); return; }
    if (!emailOk)     { setError('That email address is invalid.'); return; }
    if (!cellOk)      { setError('Cell number must be 10 digits starting with 0.'); return; }
    if (!pwOk)        { setError('Password does not meet the requirements yet.'); return; }
    if (!confirmOk)   { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

      await setDoc(doc(db, 'users', cred.user.uid), {
        studentNo,
        email: email.trim(),
        cell,
        budget: 1000,
        items: [],
        history: [],
        prefs: {
          color: '',
          size: '',
          radius: '5',
          shipping: 'cheapest',
          favStores: '',
          favStyles: '',
          hobbies: '',
        },
        createdAt: Date.now(),
      }, { merge: true });

      setSuccess('Account created! Welcome 🎉');
    } catch (err) {
      const code = err.code || '';
      if (code.includes('email-already-in-use')) setError('That email is already registered. Try logging in.');
      else if (code.includes('weak-password')) setError('Password too weak.');
      else if (code.includes('invalid-email')) setError('Email is invalid.');
      else setError('Sign up failed. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: 12,
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 16,
    marginTop: 6,
    WebkitAppearance: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#444',
    marginTop: 14,
  };

  const hintStyle = {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  };

  const borderOk = (ok) => ({ borderColor: ok ? '#00b894' : '#ddd' });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f6fa',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, Arial, sans-serif',
    }}>
      <div style={{ maxWidth: 460, margin: '0 auto' }}>

        <h1 style={{
          background:  role === 'admin' ? '#2d3436' : '#6c5ce7',
          color: 'white',
          padding: '20px 25px',
          borderRadius: 12,
          fontSize: 22,
          textAlign: 'center',
          margin: 0,
        }}>
          {role === 'admin' ? '⚙️ Admin Login' : '🛒 AI Shopping for Budgeting'}
        </h1>

        <div style={{
          background: 'white',
          padding: 30,
          borderRadius: 12,
          marginTop: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>

          {/* ── Heading depends on mode ── */}
          <h2 style={{ margin: 0, marginBottom: 5, fontSize: 20 }}>
            {mode === 'login' && 'Welcome back'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'forgot' && 'Reset your password'}
          </h2>

          <p style={{ margin: 0, marginBottom: 5, fontSize: 13, color: '#777' }}>
            {mode === 'login' && 'Log in to continue where you left off.'}
            {mode === 'signup' && 'Sign up to save your budget, preferences and shopping history.'}
            {mode === 'forgot' && "We'll email you a link to reset your password."}
          </p>

          {/* ── Signup: Student Number ── */}
          {mode === 'signup' && (
            <>
              <label style={labelStyle}>Student Number</label>
              <input
                type="text"
                placeholder="8 digits e.g. 22446653"
                value={studentNo}
                maxLength={8}
                onChange={e => setStudentNo(e.target.value.replace(/\D/g, ''))}
                style={{ ...inputStyle, ...borderOk(studentNo.length === 0 || studentNoOk) }}
              />
              {studentNo.length > 0 && !studentNoOk && (
                <div style={{ ...hintStyle, color: '#c0392b' }}>
                  Student number must be exactly 8 digits.
                </div>
              )}
              {studentNoOk && (
                <div style={{ ...hintStyle, color: '#00b894' }}>✓ Valid student number</div>
              )}
            </>
          )}

          {/* ── Email (all modes) ── */}
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={{ ...inputStyle, ...borderOk(email.length === 0 || emailOk) }}
          />
          {email.length > 0 && !emailOk && (
            <div style={{ ...hintStyle, color: '#c0392b' }}>
              Email is invalid. Use format: name@domain.com
            </div>
          )}
          {emailOk && (
            <div style={{ ...hintStyle, color: '#00b894' }}>✓ Valid email</div>
          )}

          {/* ── Signup: Cell ── */}
          {mode === 'signup' && (
            <>
              <label style={labelStyle}>Cell Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. 0821234567"
                value={cell}
                maxLength={10}
                onChange={e => setCell(e.target.value.replace(/\D/g, ''))}
                style={{ ...inputStyle, ...borderOk(cell.length === 0 || cellOk) }}
              />
              {cell.length > 0 && !cellOk && (
                <div style={{ ...hintStyle, color: '#c0392b' }}>
                  Cell number must be 10 digits starting with 0.
                </div>
              )}
              {cellOk && (
                <div style={{ ...hintStyle, color: '#00b894' }}>✓ Valid cell number</div>
              )}
            </>
          )}

          {/* ── Password (login + signup, NOT forgot) ── */}
          {mode !== 'forgot' && (
            <>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                placeholder={mode === 'signup' ? 'Enter password' : 'Your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                style={{ ...inputStyle, ...borderOk(password.length === 0 || pwOk) }}
              />

              {mode === 'signup' && password.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <Rule ok={pwRules.length} text="At least 6 characters" />
                  <Rule ok={pwRules.upper} text="At least 1 uppercase letter (A-Z)" />
                  <Rule ok={pwRules.lower} text="At least 1 lowercase letter (a-z)" />
                  <Rule ok={pwRules.number} text="At least 1 number (0-9)" />
                  <Rule ok={pwRules.special} text="At least 1 special character (!@#$...)" />
                </div>
              )}
            </>
          )}

          {/* ── Confirm password (signup only) ── */}
          {mode === 'signup' && (
            <>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                style={{ ...inputStyle, ...borderOk(confirm.length === 0 || confirmOk) }}
              />
              {confirm.length > 0 && !confirmOk && (
                <div style={{ ...hintStyle, color: '#c0392b' }}>Passwords do not match.</div>
              )}
              {confirmOk && (
                <div style={{ ...hintStyle, color: '#00b894' }}>✓ Passwords match</div>
              )}
            </>
          )}

          {/* ── Forgot password link (login mode only) ── */}
          {mode === 'login' && (
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <button
                onClick={() => switchMode('forgot')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6c5ce7',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: 13,
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* ── Feedback ── */}
          {error && (
            <div style={{
              marginTop: 16,
              padding: 12,
              background: '#ffe5e5',
              color: '#c0392b',
              borderRadius: 8,
              fontSize: 13,
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              marginTop: 16,
              padding: 12,
              background: '#d4edda',
              color: '#155724',
              borderRadius: 8,
              fontSize: 13,
              lineHeight: 1.5,
            }}>
              {success}
            </div>
          )}

          {/* ── Submit ── */}
          <button
            onClick={submit}
            disabled={loading}
            style={{
              marginTop: 20,
              width: '100%',
              background: loading ? '#aaa' : 'linear-gradient(90deg, #6c5ce7, #a29bfe)',
              color: 'white',
              border: 'none',
              padding: '14px 20px',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 'bold',
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: '0 2px 6px rgba(108,92,231,0.3)',
              minHeight: 48,
            }}
          >
            {loading && 'Please wait...'}
            {!loading && mode === 'login' && 'Log In'}
            {!loading && mode === 'signup' && 'Create Account'}
            {!loading && mode === 'forgot' && 'Send Reset Email'}
          </button>

          {/* ── Mode switcher ── */}
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#666' }}>
            {mode === 'login' && role !== 'admin' &&(
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  style={{
                    background: 'none', border: 'none', color: '#6c5ce7',
                    fontWeight: 'bold', cursor: 'pointer', fontSize: 13, padding: 0,
                  }}
                >
                  Sign up
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('login')}
                  style={{
                    background: 'none', border: 'none', color: '#6c5ce7',
                    fontWeight: 'bold', cursor: 'pointer', fontSize: 13, padding: 0,
                  }}
                >
                  Log in
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <>
                Remembered it?{' '}
                <button
                  onClick={() => switchMode('login')}
                  style={{
                    background: 'none', border: 'none', color: '#6c5ce7',
                    fontWeight: 'bold', cursor: 'pointer', fontSize: 13, padding: 0,
                  }}
                >
                  Back to login
                </button>
              </>
            )}
          </div>

        </div>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: '#aaa' }}>
          🔒 Your data is stored securely in Firebase
        </div>
      </div>
    </div>
  );
}