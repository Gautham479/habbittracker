import { useState } from 'react';
import HabitTracker from './components/HabitTracker';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default credentials as requested
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid login id or password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 selection:bg-zinc-500 selection:text-white font-sans">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2">Access</h1>
            <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Secure Protocol</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Login ID</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-zinc-500 transition-colors uppercase font-bold"
                placeholder="ENTER ID"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-zinc-700 text-white rounded-xl focus:outline-none focus:border-zinc-500 transition-colors font-bold"
                placeholder="ENTER PASSWORD"
              />
            </div>
            
            {error && <p className="text-red-500 text-xs font-bold uppercase tracking-wider text-center">{error}</p>}
            
            <button 
              type="submit" 
              className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-zinc-200 transition-colors transform active:scale-95 mt-4"
            >
              Enter Tracker
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <HabitTracker />;
}

export default App;
