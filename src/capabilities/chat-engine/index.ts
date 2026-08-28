/**
 * CHAT ENGINE MODULE
 *
 * Core chat interface with multi-persona orchestration support.
 */

import { MessageSquare } from 'lucide-react';
import type { ModuleDefinition } from '@/core/ModuleRegistry';
import { validateCapabilityGraph } from '@/core/soul/CapabilityGraph';
import { ChatEngine } from './ChatEngine';

const chatEngineModule: ModuleDefinition = {
  metadata: {
    id: 'chat-engine',
    name: 'Chat Engine',
    description: 'Multi-persona AI chat with orchestration',
    icon: MessageSquare,
    version: '1.0.0',
    category: 'core',
    priority: 1,
    permissions: [
      { id: 'chat:send', name: 'Send Messages', description: 'Ability to send messages to AI models' },
      { id: 'chat:history', name: 'Access History', description: 'Access to chat history and sessions' },
    ],
  },
  Component: ChatEngine,
  onMount: async () => {
    validateCapabilityGraph();
    console.log('[ChatEngine] Module mounted; N01 capability graph validated');
  },
  onUnmount: async () => {
    console.log('[ChatEngine] Module unmounted');
  },
};

export default chatEngineModule;
