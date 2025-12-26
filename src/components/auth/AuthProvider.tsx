/**
 * AUTH PROVIDER
 * 
 * Handles authentication state and session management.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGlobalStore } from '@/stores/globalStore';
import { EventBus } from '@/core/EventBus';
import { Loader2 } from 'lucide-react';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading, setApiKeys, isLoading } = useGlobalStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          EventBus.emit('auth:login', { userId: session.user.id });
          
          // Load API keys for user
          const { data: keys } = await supabase
            .from('api_keys')
            .select('provider, is_active')
            .eq('user_id', session.user.id);
          
          if (keys) {
            setApiKeys(keys.map(k => ({
              provider: k.provider,
              configured: k.is_active,
            })));
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          EventBus.emit('auth:login', { userId: session.user.id });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          EventBus.emit('auth:logout', undefined);
        } else if (event === 'TOKEN_REFRESHED') {
          // Session refreshed
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, setApiKeys]);

  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground font-mono">
            Initializing Aeternum...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
