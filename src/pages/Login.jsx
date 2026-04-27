import { useState, useEffect } from 'react';
import { supabase } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/';
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin }
    });
    setSending(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <ShoppingCart className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">EcomServer</span>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          {sent ? (
            <div className="text-center space-y-3 py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold">Check your inbox</h2>
              <p className="text-sm text-muted-foreground">
                We sent a magic link to <strong>{email}</strong>. Click it to sign in.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-xs text-muted-foreground hover:text-foreground underline pt-2"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold">Sign in</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your email and we'll send you a magic link.
                </p>
              </div>
              <div>
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="h-9"
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" disabled={sending} className="w-full">
                {sending ? 'Sending...' : 'Send magic link'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
