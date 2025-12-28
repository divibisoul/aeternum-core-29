/**
 * LOGIN SCREEN
 * 
 * Real Supabase authentication for Aeternum.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Loader2, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Map username to email for cleaner UX
const usernameToEmail = (username: string) => `${username.toLowerCase()}@aeternum.local`;

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const email = usernameToEmail(username);

    try {
      if (isSignUp) {
        // Sign up flow
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: username }
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('Usuário já existe. Tente fazer login.');
          } else {
            setError(signUpError.message);
          }
          setIsLoading(false);
          return;
        }

        toast.success(`Conta criada! Bem-vindo ao Aeternum, ${username}!`);
        onLogin();
      } else {
        // Sign in flow
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login')) {
            setError('Usuário ou senha inválidos');
          } else {
            setError(signInError.message);
          }
          setIsLoading(false);
          return;
        }

        toast.success(`Bem-vindo de volta, ${username}!`);
        onLogin();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Erro ao autenticar. Tente novamente.');
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
          <form onSubmit={handleAuth} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="h-3 w-3" /> Usuário
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Digite seu usuário"
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
                <Lock className="h-3 w-3" /> Senha
              </label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Digite sua senha"
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
                  {isSignUp ? 'Criando conta...' : 'Autenticando...'}
                </>
              ) : (
                isSignUp ? 'Criar Conta' : 'Acessar Aeternum'
              )}
            </Button>

            {/* Toggle Sign Up / Sign In */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-sm text-primary hover:underline"
              >
                {isSignUp ? 'Já tem conta? Fazer login' : 'Não tem conta? Criar agora'}
              </button>
            </div>
          </form>

          {/* Decorative line */}
          <div className="mt-6 pt-6 border-t border-border/30">
            <p className="text-center text-xs text-muted-foreground">
              Interface neural segura v1.0
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
