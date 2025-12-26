/**
 * SETTINGS COMPONENT
 * 
 * System configuration, API keys, and preferences management.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Key, Shield, Palette, Bell, Database, 
  ChevronRight, Check, Trash2, Plus, RefreshCw,
  User, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ModuleComponentProps } from '@/core/ModuleRegistry';
import { useGlobalStore } from '@/stores/globalStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SettingsSection {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const SECTIONS: SettingsSection[] = [
  { id: 'api-keys', name: 'API Keys', icon: Key, description: 'Manage AI provider credentials' },
  { id: 'security', name: 'Security', icon: Shield, description: 'Privacy and security settings' },
  { id: 'appearance', name: 'Appearance', icon: Palette, description: 'Theme and display options' },
  { id: 'notifications', name: 'Notifications', icon: Bell, description: 'Alert preferences' },
  { id: 'data', name: 'Data & Storage', icon: Database, description: 'Manage sessions and memory' },
  { id: 'account', name: 'Account', icon: User, description: 'Profile and authentication' },
];

export function Settings({ isActive }: ModuleComponentProps) {
  const [activeSection, setActiveSection] = useState('api-keys');
  const { user, apiKeys, theme, setTheme } = useGlobalStore();

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'api-keys':
        return <ApiKeysSection />;
      case 'security':
        return <SecuritySection />;
      case 'appearance':
        return <AppearanceSection theme={theme} setTheme={setTheme} />;
      case 'account':
        return <AccountSection user={user} />;
      default:
        return <ComingSoonSection />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-border/30 bg-card/30 p-4">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">Settings</h2>
        <nav className="space-y-1">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{section.name}</div>
                </div>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderSectionContent()}
        </motion.div>
      </div>
    </div>
  );
}

function ApiKeysSection() {
  const { apiKeys } = useGlobalStore();
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div>
      <div className="mb-6">
        <h3 className="font-display text-xl font-semibold text-foreground">API Keys</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your AI provider API keys. Keys are encrypted at rest.
        </p>
      </div>

      <div className="space-y-4">
        {/* Configured Keys */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-foreground">Configured Providers</span>
            <Button variant="neon" size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Key
            </Button>
          </div>

          {apiKeys.length > 0 ? (
            <div className="space-y-2">
              {apiKeys.map((key) => (
                <div
                  key={key.provider}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Key className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground capitalize">{key.provider}</div>
                      <div className="text-xs text-muted-foreground">
                        {key.configured ? 'Active' : 'Not configured'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {key.configured && (
                      <span className="flex items-center gap-1 text-xs text-primary">
                        <Check className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                    <Button variant="ghost" size="icon-sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No API keys configured</p>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-3 rounded-lg bg-primary/10 p-4 border border-primary/20">
          <Shield className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Security:</span> API keys are encrypted using AES-256 
            before storage and are never logged or exposed in plain text.
          </div>
        </div>
      </div>
    </div>
  );
}

function SecuritySection() {
  return (
    <div>
      <div className="mb-6">
        <h3 className="font-display text-xl font-semibold text-foreground">Security</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure security and privacy settings.
        </p>
      </div>

      <div className="space-y-4">
        <div className="glass rounded-xl p-4">
          <div className="space-y-4">
            <ToggleSetting
              title="Two-Factor Authentication"
              description="Add an extra layer of security to your account"
              enabled={false}
            />
            <ToggleSetting
              title="Session Encryption"
              description="Encrypt all session data at rest"
              enabled={true}
            />
            <ToggleSetting
              title="Audit Logging"
              description="Log all security-relevant events"
              enabled={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AppearanceSection({ theme, setTheme }: { theme: string; setTheme: (t: 'dark' | 'light') => void }) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="font-display text-xl font-semibold text-foreground">Appearance</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Customize the look and feel of Aeternum.
        </p>
      </div>

      <div className="glass rounded-xl p-4">
        <div className="mb-4">
          <span className="text-sm font-medium text-foreground">Theme</span>
          <p className="text-xs text-muted-foreground">Select your preferred color scheme</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              "rounded-lg border p-4 text-left transition-all",
              theme === 'dark'
                ? "border-primary bg-primary/10"
                : "border-border/50 hover:border-border"
            )}
          >
            <div className="h-20 rounded-lg bg-[#0a0c14] mb-3 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.5)]" />
            </div>
            <div className="font-medium text-foreground">Dark (Cyberpunk)</div>
            <div className="text-xs text-muted-foreground">Default HUD theme</div>
          </button>

          <button
            onClick={() => setTheme('light')}
            className={cn(
              "rounded-lg border p-4 text-left transition-all",
              theme === 'light'
                ? "border-primary bg-primary/10"
                : "border-border/50 hover:border-border"
            )}
          >
            <div className="h-20 rounded-lg bg-gray-100 mb-3 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-blue-500" />
            </div>
            <div className="font-medium text-foreground">Light</div>
            <div className="text-xs text-muted-foreground">Coming soon</div>
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountSection({ user }: { user: any }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="font-display text-xl font-semibold text-foreground">Account</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile and authentication.
        </p>
      </div>

      <div className="space-y-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-xl bg-primary/20 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="font-medium text-foreground">
                {user?.email || 'Guest User'}
              </div>
              <div className="text-sm text-muted-foreground">
                {user ? 'Authenticated' : 'Demo Mode'}
              </div>
            </div>
          </div>

          {user && (
            <Button variant="outline" onClick={handleSignOut} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ComingSoonSection() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <RefreshCw className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground">Coming Soon</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This feature is under development.
        </p>
      </div>
    </div>
  );
}

function ToggleSetting({ 
  title, 
  description, 
  enabled 
}: { 
  title: string; 
  description: string; 
  enabled: boolean;
}) {
  const [isEnabled, setIsEnabled] = useState(enabled);

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="font-medium text-foreground text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <button
        onClick={() => setIsEnabled(!isEnabled)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          isEnabled ? "bg-primary" : "bg-muted"
        )}
      >
        <div
          className={cn(
            "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform",
            isEnabled ? "left-6" : "left-1"
          )}
        />
      </button>
    </div>
  );
}
