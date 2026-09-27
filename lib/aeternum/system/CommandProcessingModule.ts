/**
 * L6 — COMMAND PROCESSING MODULE
 * Host: N01 | Affinity: M2_ORCHESTRATION
 *
 * Uses the canonical N01 AeternumEventBus/HortaCore.
 * It deliberately does NOT register a second canonical Wormhole module.
 * Execution is real only when an executor is explicitly registered.
 */
import { aeternumBus } from "../EventBus";
import { aeternumHortaCore } from "../HortaCore";

export type CommandPriority = "low" | "normal" | "high" | "critical";
export type CommandStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";

export interface Command {
  id: string;
  name: string;
  payload: unknown;
  priority: CommandPriority;
  status: CommandStatus;
  enqueuedAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: unknown;
  error?: string;
}

export type CommandExecutor = (command: Command) => Promise<unknown>;

const PRIORITY: Record<CommandPriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

export class CommandProcessingModule {
  readonly id = "command-processing" as const;
  private active = false;
  private readonly queue: string[] = [];
  private readonly commands = new Map<string, Command>();
  private readonly executors = new Map<string, CommandExecutor>();
  private sequence = 0;
  private activeCommands = 0;
  private readonly maxConcurrent = 3;

  constructor() {
    aeternumBus.on<{ name: string; payload: unknown; priority?: CommandPriority }>(
      "command.enqueue",
      data => { this.enqueue(data); },
    );
    aeternumBus.on<{ id: string }>("command.execute", data => { void this.execute(data.id); });
    aeternumBus.on<{ id: string }>("command.cancel", data => { this.cancel(data.id); });
    aeternumBus.on("command.clear", () => { this.clear(); });
  }

  activate(): void {
    this.active = true;
    aeternumHortaCore.set(`${this.id}.active`, true);
    void aeternumBus.emit("command-processing.activated", { timestamp: Date.now() });
    void this.processQueue();
  }

  deactivate(): void {
    this.active = false;
    aeternumHortaCore.set(`${this.id}.active`, false);
    void aeternumBus.emit("command-processing.deactivated", { timestamp: Date.now() });
  }

  registerExecutor(name: string, executor: CommandExecutor): void {
    const normalized = name.trim();
    if (!normalized) throw new Error("COMMAND_EXECUTOR_NAME_REQUIRED");
    if (this.executors.has(normalized)) {
      throw new Error(`COMMAND_EXECUTOR_ALREADY_REGISTERED:${normalized}`);
    }
    this.executors.set(normalized, executor);
    void this.processQueue();
  }

  unregisterExecutor(name: string): void {
    this.executors.delete(name);
  }

  enqueue(data: {
    name: string;
    payload: unknown;
    priority?: CommandPriority;
  }): string {
    const name = data.name.trim();
    if (!name) throw new Error("COMMAND_NAME_REQUIRED");

    const id = `cmd-${Date.now()}-${this.sequence++}`;
    const command: Command = {
      id,
      name,
      payload: data.payload,
      priority: data.priority ?? "normal",
      status: "queued",
      enqueuedAt: Date.now(),
    };
    this.commands.set(id, command);
    this.queue.push(id);
    this.sortQueue();
    this.persistState();
    void aeternumBus.emit("command.enqueued", command);
    void this.processQueue();
    return id;
  }

  async execute(id: string): Promise<void> {
    const command = this.commands.get(id);
    if (!command || command.status !== "queued") {
      void aeternumBus.emit("command.error", { id, message: "COMMAND_NOT_QUEUED" });
      return;
    }
    if (this.queue.includes(id)) {
      this.queue.splice(this.queue.indexOf(id), 1);
    }
    await this.run(command);
  }

  cancel(id: string): void {
    const command = this.commands.get(id);
    if (!command || command.status !== "queued") return;
    command.status = "cancelled";
    const index = this.queue.indexOf(id);
    if (index >= 0) this.queue.splice(index, 1);
    this.persistState();
    void aeternumBus.emit("command.cancelled", command);
  }

  clear(): void {
    for (const id of [...this.queue]) {
      const command = this.commands.get(id);
      if (command && command.status === "queued") command.status = "cancelled";
    }
    this.queue.length = 0;
    this.persistState();
    void aeternumBus.emit("command.cleared", { timestamp: Date.now() });
  }

  getQueue(): Command[] {
    return this.queue
      .map(id => this.commands.get(id))
      .filter((command): command is Command => Boolean(command))
      .map(command => ({ ...command }));
  }

  getCompleted(): Command[] {
    return [...this.commands.values()]
      .filter(command => command.status === "completed")
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
      .slice(0, 50)
      .map(command => ({ ...command }));
  }

  getState(): { active: boolean; queued: number; processing: number; completed: number } {
    return {
      active: this.active,
      queued: this.getQueue().length,
      processing: [...this.commands.values()].filter(c => c.status === "processing").length,
      completed: [...this.commands.values()].filter(c => c.status === "completed").length,
    };
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      const left = this.commands.get(a);
      const right = this.commands.get(b);
      if (!left || !right) return 0;
      const priorityDiff = PRIORITY[right.priority] - PRIORITY[left.priority];
      return priorityDiff !== 0 ? priorityDiff : left.enqueuedAt - right.enqueuedAt;
    });
  }

  private async processQueue(): Promise<void> {
    if (!this.active) return;
    while (this.queue.length > 0 && this.activeCommands < this.maxConcurrent) {
      const id = this.queue.shift();
      if (!id) break;
      const command = this.commands.get(id);
      if (!command || command.status !== "queued") continue;

      const executor = this.executors.get(command.name);
      if (!executor) {
        this.queue.unshift(id);
        this.sortQueue();
        void aeternumBus.emit("command.unbound", {
          id: command.id,
          name: command.name,
          reason: "NO_EXECUTOR_REGISTERED",
        });
        break;
      }

      this.activeCommands += 1;
      void this.run(command).finally(() => {
        this.activeCommands -= 1;
        void this.processQueue();
      });
    }
    this.persistState();
  }

  private async run(command: Command): Promise<void> {
    const executor = this.executors.get(command.name);
    if (!executor) {
      void aeternumBus.emit("command.unbound", {
        id: command.id,
        name: command.name,
        reason: "NO_EXECUTOR_REGISTERED",
      });
      return;
    }

    command.status = "processing";
    command.startedAt = Date.now();
    void aeternumBus.emit("command.started", { ...command });

    try {
      command.result = await executor({ ...command });
      command.status = "completed";
      command.completedAt = Date.now();
      void aeternumBus.emit("command.completed", { ...command });
    } catch (error) {
      command.status = "failed";
      command.error = error instanceof Error ? error.message : String(error);
      command.completedAt = Date.now();
      void aeternumBus.emit("command.failed", { ...command });
    }
    this.persistState();
  }

  private persistState(): void {
    aeternumHortaCore.set(`systemComponents.${this.id}.queueLength`, this.queue.length);
    aeternumHortaCore.set(
      `systemComponents.${this.id}.processing`,
      [...this.commands.values()].filter(c => c.status === "processing").length,
    );
  }
}

export const commandProcessingModule = new CommandProcessingModule();
