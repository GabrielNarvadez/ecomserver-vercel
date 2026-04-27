import { useState, useEffect } from 'react';
import { supabase } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Mail } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState('password'); // 'password' | 'magic'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/';
    });
  }, []);

  const handlePassword = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    setSubmitting(false);
    if (error) setError(error.message);
    else window.location.href = '/';
  };

  const handleMagic = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin }
    });
    setSubmitting(false);
    if (error) setError(error.message);
    else setMagicSent(true);
  };

  const handleGoogle = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">EcomServer</span>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          {magicSent ? (
            <div className="text-center space-y-3 py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold">Check your inbox</h2>
              <p className="text-sm text-muted-foreground">
                We sent a magic link to <strong>{email}</strong>. Click it to sign in.
              </p>
              <button
                onClick={() => { setMagicSent(false); }}
                className="text-xs text-muted-foreground hover:text-foreground underline pt-2"
              >
                Use a different option
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold">Sign in</h2>
                <p className="text-sm text-muted-foreground">
                  Use your email and password, or one of the options below.
                </p>
              </div>

              <form onSubmit={mode === 'password' ? handlePassword : handleMagic} className="space-y-4">
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

                {mode === 'password' && (
                  <div>
                    <Label htmlFor="password" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="h-9"
                    />
                  </div>
                )}

                {error && <p className="text-xs text-destructive">{error}</p>}

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting
                    ? (mode === 'password' ? 'Signing in...' : 'Sending...')
                    : (mode === 'password' ? 'Sign in' : 'Send magic link')}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => { setMode(m => m === 'password' ? 'magic' : 'password'); setError(null); }}
                className="text-xs text-muted-foreground hover:text-foreground underline w-full text-center"
              >
                {mode === 'password' ? 'No password? Use magic link instead' : 'Use password instead'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
              </div>

              <Button type="button" variant="outline" onClick={handleGoogle} className="w-full gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.23 1 12s.43 3.45 1.18 4.96l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
                Continue with Google
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
