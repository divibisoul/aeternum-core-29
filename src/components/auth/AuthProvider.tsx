/**
 * AUTH PROVIDER
 * 
 * Handles authentication state and session management.
 * Follows best practices to avoid deadlocks.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGlobalStore } from '@/stores/globalStore';
import { EventBus } from '@/core/EventBus';
import { Loader2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading, setApiKeys, setHasRequiredApiKeys, isLoading } = useGlobalStore();
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // 1. Set up auth state listener FIRST (synchronous callback, no async!)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // Only synchronous state updates here
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          EventBus.emit('auth:login', { userId: newSession.user.id });
          
          // Defer Supabase calls with setTimeout to avoid deadlock
          setTimeout(() => {
            loadApiKeys(newSession.user.id);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          EventBus.emit('auth:logout', undefined);
          setApiKeys([]);
          setHasRequiredApiKeys(false);
        }
      }
    );

    // 2. THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        // Load API keys after setting user
        setTimeout(() => {
          loadApiKeys(existingSession.user.id);
        }, 0);
      }
      
      setLoading(false);
      setInitialized(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, setApiKeys, setHasRequiredApiKeys]);

  // Load API keys for a user
  const loadApiKeys = async (userId: string) => {
    try {
      const { data: keys } = await supabase
        .from('api_keys')
        .select('provider, is_active')
        .eq('user_id', userId);

      if (keys && keys.length > 0) {
        setApiKeys(keys.map(k => ({
          provider: k.provider,
          configured: k.is_active,
        })));
      }
      
      // Always set hasRequiredApiKeys to true since we have Lovable AI
      setHasRequiredApiKeys(true);
    } catch (error) {
      console.error('Error loading API keys:', error);
      // Even on error, we have Lovable AI available
      setHasRequiredApiKeys(true);
    }
  };

  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground font-mono">
            Inicializando Aeternum...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
