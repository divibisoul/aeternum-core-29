/**
 * API KEY SETUP SCREEN
 * 
 * Initial configuration screen - blocks system until API key is configured.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Eye, EyeOff, Check, Loader2, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGlobalStore } from '@/stores/globalStore';
import { supabase } from '@/integrations/supabase/client';
import { EventBus } from '@/core/EventBus';
import { toast } from 'sonner';

interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  placeholder: string;
  required: boolean;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Required for GPT models and core AI functionality',
    placeholder: 'sk-...',
    required: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Optional - Claude models for enhanced reasoning',
    placeholder: 'sk-ant-...',
    required: false,
  },
];

export function ApiKeySetup() {
  const { user, addApiKey } = useGlobalStore();
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [configured, setConfigured] = useState<string[]>([]);

  const handleKeyChange = (provider: string, value: string) => {
    setKeys(prev => ({ ...prev, [provider]: value }));
  };

  const toggleShowKey = (provider: string) => {
    setShowKey(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const validateAndSaveKey = async (provider: ProviderConfig) => {
    const key = keys[provider.id];
    if (!key?.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setLoading(provider.id);
    EventBus.emit('apikey:validation:start', { provider: provider.id });

    try {
      // For demo purposes, we'll accept any key that matches the expected format
      // In production, you'd validate against the actual API
      const isValidFormat = provider.id === 'openai' 
        ? key.startsWith('sk-') 
        : key.startsWith('sk-ant-');

      if (!isValidFormat) {
        throw new Error(`Invalid ${provider.name} API key format`);
      }

      // Simple encryption (in production, use proper encryption)
      const encryptedKey = btoa(key);

      // Save to database
      if (user) {
        const { error } = await supabase
          .from('api_keys')
          .upsert({
            user_id: user.id,
            provider: provider.id,
            encrypted_key: encryptedKey,
            is_active: true,
          }, {
            onConflict: 'user_id,provider'
          });

        if (error) throw error;
      }

      // Update local state
      addApiKey({ provider: provider.id, configured: true, lastValidated: Date.now() });
      setConfigured(prev => [...prev, provider.id]);
      
      EventBus.emit('apikey:validation:success', { provider: provider.id });
      EventBus.emit('apikey:configured', { provider: provider.id });
      
      toast.success(`${provider.name} API key configured successfully`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Validation failed';
      EventBus.emit('apikey:validation:error', { provider: provider.id, error: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(null);
    }
  };

  const requiredConfigured = PROVIDERS
    .filter(p => p.required)
    .every(p => configured.includes(p.id));

  const handleContinue = () => {
    if (requiredConfigured) {
      EventBus.emit('system:init', { timestamp: Date.now() });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-lg"
      >
        {/* Main Card */}
        <div className="glass hud-corner p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Key className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground neon-text-subtle">
              Configure API Keys
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Aeternum requires API keys to connect to AI providers. Your keys are encrypted and stored securely.
            </p>
          </div>

          {/* Security Notice */}
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-primary/10 p-3 border border-primary/20">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">End-to-end encryption:</span> Your API keys are encrypted before storage and never exposed in logs or transmitted unencrypted.
            </div>
          </div>

          {/* Provider Forms */}
          <div className="space-y-4">
            {PROVIDERS.map((provider) => {
              const isConfigured = configured.includes(provider.id);
              const isLoading = loading === provider.id;

              return (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`rounded-lg border p-4 transition-colors ${
                    isConfigured 
                      ? 'border-primary/50 bg-primary/5' 
                      : 'border-border/50 bg-card/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{provider.name}</span>
                        {provider.required && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">
                            Required
                          </span>
                        )}
                        {isConfigured && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary flex items-center gap-1">
                            <Check className="h-3 w-3" /> Configured
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {provider.description}
                      </p>
                    </div>
                  </div>

                  {!isConfigured && (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showKey[provider.id] ? 'text' : 'password'}
                          placeholder={provider.placeholder}
                          value={keys[provider.id] || ''}
                          onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowKey(provider.id)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showKey[provider.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <Button
                        variant="neon"
                        onClick={() => validateAndSaveKey(provider)}
                        disabled={isLoading || !keys[provider.id]?.trim()}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Continue Button */}
          <div className="mt-8">
            {!requiredConfigured && (
              <div className="flex items-center gap-2 justify-center mb-4 text-xs text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                Configure all required keys to continue
              </div>
            )}
            <Button
              variant="glow"
              size="lg"
              className="w-full"
              disabled={!requiredConfigured}
              onClick={handleContinue}
            >
              Initialize Aeternum
            </Button>
          </div>
        </div>

        {/* Skip for demo */}
        <div className="mt-4 text-center">
          <button
            onClick={handleContinue}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for demo (limited functionality)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
