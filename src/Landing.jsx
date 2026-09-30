export default function Landing({ onStudent, onAdmin }) {
  const features = [
    { icon: '🧠', title: 'AI Recommendations', desc: 'Gemini ranks products against YOUR budget — not everyone else\'s.' },
    { icon: '💰', title: 'Budget-First', desc: 'Enter your NSFAS allowance once. Every product shows budget impact.' },
    { icon: '🔍', title: '100+ Products', desc: 'Groceries, toiletries, clothing, stationery, electronics — all in one place.' },
    { icon: '🛒', title: 'Smart Shopping List', desc: 'Track what you plan to buy. See the total before you commit.' },
    { icon: '☁️', title: 'Cloud Sync', desc: 'Your budget and preferences follow you across devices.' },
    { icon: '🎓', title: 'Built for DUT', desc: 'Student-focused. Verified accounts. Made for residence life.' },
  ];

  const steps = [
    { num: '1', title: 'Enter your budget', desc: 'Tell the app how much you have for the month.' },
    { num: '2', title: 'Set preferences', desc: 'Colour, size, favourite stores, hobbies — we learn what you like.' },
    { num: '3', title: 'Get ranked results', desc: 'AI sorts 100+ products by what fits your remaining budget.' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #6c5ce7 0%, #a29bfe 40%, #f5f6fa 100%)',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
    }}>

      {/* Hero section */}
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '60px 20px 40px',
        textAlign: 'center',
        color: 'white',
      }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.15)',
          padding: '6px 14px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 'bold',
          letterSpacing: 0.5,
          marginBottom: 20,
        }}>
          🎓 FOR DUT STUDENTS
        </div>

        <h1 style={{
          fontSize: 42,
          margin: 0,
          lineHeight: 1.15,
          fontWeight: 800,
          letterSpacing: -0.5,
        }}>
          🛒 AI Shopping<br />for Budgeting
        </h1>

        <p style={{
          fontSize: 17,
          marginTop: 20,
          marginBottom: 0,
          lineHeight: 1.5,
          opacity: 0.95,
          maxWidth: 600,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Plan your NSFAS allowance. Compare prices. Get AI recommendations that actually fit your budget — not just what looks good.
        </p>

        {/* Two CTA buttons */}
        <div style={{
          marginTop: 36,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 320,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          <button
            onClick={onStudent}
            style={{
              background: 'white',
              color: '#6c5ce7',
              border: 'none',
              padding: '16px 24px',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              minHeight: 52,
            }}
          >
            🎓 I'm a Student →
          </button>

          <button
            onClick={onAdmin}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '1.5px solid rgba(255,255,255,0.4)',
              padding: '12px 24px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 'bold',
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            ⚙️ Admin Login
          </button>
        </div>

        <div style={{ marginTop: 20, fontSize: 11, opacity: 0.8 }}>
          Free for DUT students • Powered by Google Gemini AI
        </div>
      </div>

      {/* White content panel */}
      <div style={{
        background: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: '50px 20px 60px',
        marginTop: 40,
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Problem section */}
          <div style={{
            background: '#fff5e6',
            border: '1px solid #ffe0b2',
            padding: 24,
            borderRadius: 16,
            marginBottom: 50,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#b26a00', letterSpacing: 1 }}>
              THE PROBLEM
            </div>
            <p style={{
              fontSize: 16,
              margin: '12px 0 0',
              color: '#333',
              lineHeight: 1.5,
            }}>
              Many NSFAS-funded students run out of money before month-end because they can't easily compare prices, track spending, and plan around a fixed allowance.
            </p>
          </div>

          {/* How it works */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#6c5ce7', letterSpacing: 1 }}>
              HOW IT WORKS
            </div>
            <h2 style={{ fontSize: 26, margin: '8px 0 0', color: '#222' }}>
              Three steps to smarter shopping
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
            marginBottom: 60,
          }}>
            {steps.map(s => (
              <div key={s.num} style={{
                background: '#f8f9fd',
                padding: 24,
                borderRadius: 16,
                textAlign: 'center',
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#6c5ce7',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: 18,
                  margin: '0 auto 14px',
                }}>
                  {s.num}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: 15, color: '#222', marginBottom: 6 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#6c5ce7', letterSpacing: 1 }}>
              FEATURES
            </div>
            <h2 style={{ fontSize: 26, margin: '8px 0 0', color: '#222' }}>
              Everything you need in one place
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
            marginBottom: 60,
          }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: 'white',
                border: '1px solid #eee',
                padding: 22,
                borderRadius: 14,
              }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontWeight: 'bold', fontSize: 15, color: '#222', marginBottom: 6 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Stats strip */}
          <div style={{
            background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
            color: 'white',
            padding: 30,
            borderRadius: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 20,
            textAlign: 'center',
            marginBottom: 50,
          }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 'bold' }}>100+</div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>Products</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 'bold' }}>6</div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>SA Stores</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 'bold' }}>AI</div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>Powered by Gemini</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 'bold' }}>Free</div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>For students</div>
            </div>
          </div>

          {/* Final CTA */}
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <h2 style={{ fontSize: 24, margin: '0 0 12px', color: '#222' }}>
              Ready to shop smarter?
            </h2>
            <p style={{ fontSize: 14, color: '#666', margin: '0 0 24px' }}>
              Join DUT students who are making their allowance last the whole month.
            </p>
            <button
              onClick={onStudent}
              style={{
                background: 'linear-gradient(90deg, #6c5ce7, #a29bfe)',
                color: 'white',
                border: 'none',
                padding: '16px 40px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(108,92,231,0.35)',
                minHeight: 52,
              }}
            >
              Get Started →
            </button>
          </div>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid #eee',
            paddingTop: 24,
            marginTop: 30,
            textAlign: 'center',
            fontSize: 11,
            color: '#999',
            lineHeight: 1.6,
          }}>
            🛒 AI Shopping for Budgeting • DUT Student Project 2026<br />
            Powered by Google Gemini AI, Firebase & React
          </div>
        </div>
      </div>
    </div>
  );
}