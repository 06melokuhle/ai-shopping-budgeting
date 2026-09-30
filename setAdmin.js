// ─────────────────────────────────────────────
// setAdmin.js — grants admin custom claim
// Run: node setAdmin.js your@email.com
// ─────────────────────────────────────────────
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

// Load service account key
const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
);

// Initialise Firebase Admin SDK (new modular API)
initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();
const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: node setAdmin.js your@email.com');
  process.exit(1);
}

async function grantAdmin() {
  try {
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, { admin: true });

    console.log('✅ Admin claim granted to:', email);
    console.log('   UID:', user.uid);
    console.log('');
    console.log('⚠️  User must LOG OUT and LOG IN again for the claim to take effect.');
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

grantAdmin();