/**
 * SETTINGS MODULE
 * 
 * System configuration and preferences.
 */

import { Settings as SettingsIcon } from 'lucide-react';
import type { ModuleDefinition } from '@/core/ModuleRegistry';
import { Settings } from './Settings';

const settingsModule: ModuleDefinition = {
  metadata: {
    id: 'settings',
    name: 'Settings',
    description: 'System configuration and API key management',
    icon: SettingsIcon,
    version: '1.0.0',
    category: 'settings',
    priority: 99,
    permissions: [
      {
        id: 'settings:read',
        name: 'Read Settings',
        description: 'View system configuration',
      },
      {
        id: 'settings:write',
        name: 'Modify Settings',
        description: 'Change system configuration',
      },
    ],
  },
  Component: Settings,
};

export default settingsModule;
