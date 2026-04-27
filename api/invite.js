// POST /api/invite { email, role, password? }
// If password is provided, create the user immediately with that password
// (no email needed). Otherwise, send a magic-link invite.
// Caller must be an authenticated admin.

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: missing Supabase env vars' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Verify the caller is an admin.
  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) return res.status(401).json({ error: 'Invalid token' });
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can invite users' });
  }

  const { email, role, password } = req.body || {};
  if (!email || !role) return res.status(400).json({ error: 'email and role are required' });
  if (!['admin', 'agent'].includes(role)) {
    return res.status(400).json({ error: 'role must be admin or agent' });
  }
  if (password && password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }

  let createdId;
  if (password) {
    // Direct create with password — no email sent.
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (error) return res.status(400).json({ error: error.message });
    createdId = data.user.id;
  } else {
    // Magic-link invite — Supabase sends the email via configured SMTP.
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
    if (error) return res.status(400).json({ error: error.message });
    createdId = data.user.id;
  }

  await admin.from('profiles').update({ role }).eq('id', createdId);

  return res.status(200).json({ ok: true, userId: createdId, mode: password ? 'password' : 'invite' });
}
