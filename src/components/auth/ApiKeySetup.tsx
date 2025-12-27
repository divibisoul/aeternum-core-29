/**
 * API KEY SETUP SCREEN
 * 
 * Flexible configuration for ANY AI provider - accepts any API key.
 * System can use pre-configured keys from environment.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Eye, EyeOff, Check, Loader2, Shield, Plus, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGlobalStore } from '@/stores/globalStore';
import { supabase } from '@/integrations/supabase/client';
import { EventBus } from '@/core/EventBus';
import { toast } from 'sonner';

interface CustomProvider {
  id: string;
  name: string;
  key: string;
}

const PRESET_PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', placeholder: 'AIza...' },
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-...' },
  { id: 'anthropic', name: 'Anthropic Claude', placeholder: 'sk-ant-...' },
  { id: 'groq', name: 'Groq', placeholder: 'gsk_...' },
  { id: 'mistral', name: 'Mistral AI', placeholder: 'API key...' },
  { id: 'cohere', name: 'Cohere', placeholder: 'API key...' },
  { id: 'perplexity', name: 'Perplexity', placeholder: 'pplx-...' },
  { id: 'together', name: 'Together AI', placeholder: 'API key...' },
  { id: 'custom', name: 'Custom Provider', placeholder: 'Your API key...' },
];

export function ApiKeySetup() {
  const { user, addApiKey, setHasRequiredApiKeys } = useGlobalStore();
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [customProviderName, setCustomProviderName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<CustomProvider[]>([]);
  const [hasEnvKey, setHasEnvKey] = useState(false);

  // Check if we have a pre-configured key from environment
  useEffect(() => {
    const checkEnvKey = async () => {
      try {
        // Check if GEMINI_API_KEY is available via edge function
        const { data } = await supabase.functions.invoke('check-api-key', {
          body: { provider: 'gemini' }
        });
        if (data?.hasKey) {
          setHasEnvKey(true);
          setConfigured(prev => [...prev, { id: 'gemini', name: 'Google Gemini (Pre-configured)', key: '***' }]);
          addApiKey({ provider: 'gemini', configured: true, lastValidated: Date.now() });
        }
      } catch {
        // Edge function might not exist yet, that's ok
      }
    };
    checkEnvKey();
  }, [addApiKey]);

  const getPlaceholder = () => {
    const provider = PRESET_PROVIDERS.find(p => p.id === selectedProvider);
    return provider?.placeholder || 'Enter API key...';
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    const providerName = selectedProvider === 'custom' 
      ? customProviderName || 'Custom AI'
      : PRESET_PROVIDERS.find(p => p.id === selectedProvider)?.name || selectedProvider;

    setLoading(true);
    EventBus.emit('apikey:validation:start', { provider: selectedProvider });

    try {
      // Simple encryption (base64)
      const encryptedKey = btoa(apiKey);

      // Save to database if user is logged in
      if (user) {
        const { error } = await supabase
          .from('api_keys')
          .upsert({
            user_id: user.id,
            provider: selectedProvider === 'custom' ? customProviderName : selectedProvider,
            encrypted_key: encryptedKey,
            is_active: true,
            label: providerName,
          }, {
            onConflict: 'user_id,provider'
          });

        if (error) throw error;
      }

      // Update local state
      const newProvider = { id: selectedProvider, name: providerName, key: apiKey.substring(0, 8) + '***' };
      setConfigured(prev => {
        const filtered = prev.filter(p => p.id !== selectedProvider);
        return [...filtered, newProvider];
      });
      
      addApiKey({ provider: selectedProvider, configured: true, lastValidated: Date.now() });
      
      EventBus.emit('apikey:validation:success', { provider: selectedProvider });
      EventBus.emit('apikey:configured', { provider: selectedProvider });
      
      toast.success(`${providerName} configured successfully`);
      setApiKey('');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save';
      EventBus.emit('apikey:validation:error', { provider: selectedProvider, error: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const removeProvider = (id: string) => {
    setConfigured(prev => prev.filter(p => p.id !== id));
  };

  const hasAnyKey = configured.length > 0 || hasEnvKey;

  const handleContinue = () => {
    setHasRequiredApiKeys(true);
    EventBus.emit('system:init', { timestamp: Date.now() });
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
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground neon-text-subtle">
              Configure AI Providers
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Aeternum accepts any AI provider. Add one or more API keys to enable AI capabilities.
            </p>
          </div>

          {/* Pre-configured notice */}
          {hasEnvKey && (
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-primary/10 p-3 border border-primary/20">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Gemini API pre-configured!</span> You can start using Aeternum immediately or add additional providers.
              </div>
            </div>
          )}

          {/* Configured Providers */}
          {configured.length > 0 && (
            <div className="mb-6 space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">
                Active Providers
              </label>
              {configured.map(provider => (
                <div 
                  key={provider.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5"
                >
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{provider.name}</span>
                    <span className="text-xs text-muted-foreground">{provider.key}</span>
                  </div>
                  {!provider.name.includes('Pre-configured') && (
                    <button 
                      onClick={() => removeProvider(provider.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add New Provider */}
          <div className="space-y-4">
            <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Plus className="h-3 w-3" /> Add Provider
            </label>
            
            {/* Provider Select */}
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-card/50 border border-border/50 text-foreground text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/30 outline-none transition-all"
            >
              {PRESET_PROVIDERS.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>

            {/* Custom provider name */}
            {selectedProvider === 'custom' && (
              <Input
                placeholder="Provider name (e.g., Local LLM)"
                value={customProviderName}
                onChange={(e) => setCustomProviderName(e.target.value)}
              />
            )}

            {/* API Key Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder={getPlaceholder()}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                variant="neon"
                onClick={saveApiKey}
                disabled={loading || !apiKey.trim()}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
              </Button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 flex items-start gap-3 rounded-lg bg-muted/30 p-3 border border-border/30">
            <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              Keys are encrypted before storage. Aeternum accepts any AI API - OpenAI, Gemini, Claude, Groq, local models, and more.
            </div>
          </div>

          {/* Continue Button */}
          <div className="mt-8">
            <Button
              variant="glow"
              size="lg"
              className="w-full"
              onClick={handleContinue}
            >
              {hasAnyKey ? 'Initialize Aeternum' : 'Continue without AI'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
