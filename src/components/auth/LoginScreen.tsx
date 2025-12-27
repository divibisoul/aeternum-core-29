/**
 * LOGIN SCREEN
 * 
 * Simple authentication screen for Aeternum.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Loader2, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGlobalStore } from '@/stores/globalStore';
import { EventBus } from '@/core/EventBus';
import { toast } from 'sonner';

// Demo credentials
const VALID_CREDENTIALS = {
  username: 'Diego',
  password: 'Iporanga@2020'
};

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const { setUser, setLoading } = useGlobalStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
      // Create a mock user object
      const mockUser = {
        id: 'aeternum-user-001',
        email: 'diego@aeternum.ai',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: { display_name: 'Diego' },
        aud: 'authenticated',
        role: 'authenticated',
      } as any;

      setUser(mockUser);
      setLoading(false);
      
      EventBus.emit('auth:login', { userId: mockUser.id });
      toast.success('Welcome to Aeternum, Diego!');
      
      onLogin();
    } else {
      setError('Invalid username or password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Logo/Brand */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-primary/30 shadow-neon">
            <Zap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold neon-text">
            AETERNUM
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Super AGI Modular Interface
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div 
          className="glass hud-corner p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="h-3 w-3" /> Username
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  autoComplete="username"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Lock className="h-3 w-3" /> Password
              </label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoComplete="current-password"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/30"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="glow"
              size="lg"
              className="w-full"
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Access Aeternum'
              )}
            </Button>
          </form>

          {/* Decorative line */}
          <div className="mt-6 pt-6 border-t border-border/30">
            <p className="text-center text-xs text-muted-foreground">
              Secure neural interface v1.0
            </p>
          </div>
        </motion.div>

        {/* Version */}
        <motion.p 
          className="mt-6 text-center text-xs text-muted-foreground/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Aeternum AGI Framework • Build 2024.12
        </motion.p>
      </motion.div>
    </div>
  );
}
