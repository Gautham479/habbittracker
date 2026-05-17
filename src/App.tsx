import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import HabitTracker from './components/HabitTracker';
import { Eye, EyeOff } from 'lucide-react';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        if (!data.session) {
          setError('Success! Please check your email for the confirmation link.');
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-bold uppercase tracking-widest text-sm animate-pulse">Initializing Protocol...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div 
        className="min-h-screen bg-black flex items-center justify-center p-4 selection:bg-zinc-500 selection:text-white font-sans bg-cover bg-center relative"
        style={{ backgroundImage: 'url("/24f8c414e74bd3cf61f0722a12f258ac (1).jpg")' }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-0"></div>
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2">{isSignUp ? 'Register' : 'Access'}</h1>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Track your habits like a pro</p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-zinc-500 transition-colors font-bold"
                placeholder="enter@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-zinc-500 transition-colors font-bold pr-12"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            {error && <p className={`text-xs font-bold tracking-wider text-center ${error.includes('Success') ? 'text-green-500' : 'text-red-500 uppercase'}`}>{error}</p>}
            
            <button 
              type="submit" 
              className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-zinc-200 transition-colors transform active:scale-95 mt-4"
            >
              {isSignUp ? 'Create Account' : 'Enter Habitsu'}
            </button>

            {!isSignUp && (
              <div className="text-center mt-2">
                <button 
                  type="button"
                  onClick={async () => {
                    if (!email) {
                      setError('Please enter your email first to reset your password.');
                      return;
                    }
                    const { error } = await supabase.auth.resetPasswordForEmail(email);
                    if (error) setError(error.message);
                    else setError('Success! Check your email for a password reset link.');
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have an account? Login' : 'Need an account? Register'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <HabitTracker session={session} />;
}

export default App;
