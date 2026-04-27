// Vercel serverless function: POST /api/invite { email, role }
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars (set in Vercel dashboard).
// Caller must be an authenticated admin (we verify their JWT against Supabase).

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
  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Verify the caller and check their role.
  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can invite users' });
  }

  const { email, role } = req.body || {};
  if (!email || !role) {
    return res.status(400).json({ error: 'email and role are required' });
  }
  if (!['admin', 'agent'].includes(role)) {
    return res.status(400).json({ error: 'role must be admin or agent' });
  }

  // Send the invite email. The new user's profile row is created automatically by the
  // on_auth_user_created trigger; we update its role afterwards.
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email);
  if (inviteErr) {
    return res.status(400).json({ error: inviteErr.message });
  }

  await admin.from('profiles').update({ role }).eq('id', invited.user.id);

  return res.status(200).json({ ok: true, userId: invited.user.id });
}
