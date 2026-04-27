// Drop-in replacement for the Base44 SDK, backed by Supabase.
// Mimics the surface the app already uses: entities.X.list/filter/create/update/delete,
// auth.me/logout/redirectToLogin, users.inviteUser.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

// Map the Base44 entity names to Postgres tables.
const tableFor = {
  Customer: 'customers',
  Order:    'orders',
  Product:  'products',
  User:     'profiles'
};

// Parse Base44-style sort strings ("-created_date" / "created_date") into Supabase order args.
const parseSort = (sortStr) => {
  if (!sortStr) return null;
  const desc = sortStr.startsWith('-');
  const column = desc ? sortStr.slice(1) : sortStr;
  return { column, ascending: !desc };
};

const throwIfError = ({ data, error }) => {
  if (error) throw Object.assign(new Error(error.message), { status: error.status, code: error.code });
  return data;
};

const makeEntity = (name) => {
  const table = tableFor[name];
  return {
    async list(sort = '-created_date', limit = 500) {
      let q = supabase.from(table).select('*');
      const ord = parseSort(sort);
      if (ord) q = q.order(ord.column, { ascending: ord.ascending });
      if (limit) q = q.limit(limit);
      return throwIfError(await q);
    },
    async filter(where = {}, sort, limit) {
      let q = supabase.from(table).select('*');
      for (const [k, v] of Object.entries(where)) {
        if (Array.isArray(v)) q = q.in(k, v);
        else q = q.eq(k, v);
      }
      const ord = parseSort(sort);
      if (ord) q = q.order(ord.column, { ascending: ord.ascending });
      if (limit) q = q.limit(limit);
      return throwIfError(await q);
    },
    async create(payload) {
      return throwIfError(await supabase.from(table).insert(payload).select().single());
    },
    async update(id, payload) {
      return throwIfError(await supabase.from(table).update(payload).eq('id', id).select().single());
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    }
  };
};

const auth = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      const e = new Error('Not authenticated');
      e.status = 401;
      throw e;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || user.email,
      role: profile?.role || 'agent',
      ...profile
    };
  },

  async logout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  },

  redirectToLogin() {
    window.location.href = '/login';
  }
};

const users = {
  // Calls our Vercel serverless function (which uses the service role key server-side).
  async inviteUser(email, role) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token || ''}`
      },
      body: JSON.stringify({ email, role })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Invite failed (${res.status})`);
    }
    return res.json();
  }
};

export const base44 = {
  entities: {
    Customer: makeEntity('Customer'),
    Order:    makeEntity('Order'),
    Product:  makeEntity('Product'),
    User:     makeEntity('User')
  },
  auth,
  users
};
