import { aeternumBus } from "../EventBus";
import { aeternumHortaCore } from "../HortaCore";

export type BlueprintRequest = {
  name: string;
  requirements: string[];
};

export type Blueprint = {
  id: string;
  name: string;
  requirements: string[];
  architecture: {
    components: string[];
    interfaces: string[];
    dataFlow: string[];
  };
  timestamp: number;
  execution: "derived_from_request";
};

export class BlueprintModule {
  readonly id = "M7.blueprint";
  private active = false;
  private readonly blueprints: Blueprint[] = [];

  constructor() {
    this.active = aeternumHortaCore.get<boolean>(`${this.id}.active`) ?? false;
    aeternumBus.on("evolution.blueprint.activate", () => this.activate());
    aeternumBus.on("evolution.blueprint.deactivate", () => this.deactivate());
    aeternumBus.on("evolution.blueprint.create", (data) => {
      void this.create(data as BlueprintRequest);
    });
  }

  activate(): void {
    this.active = true;
    aeternumHortaCore.set(`${this.id}.active`, true);
  }

  deactivate(): void {
    this.active = false;
    aeternumHortaCore.set(`${this.id}.active`, false);
  }

  async create(request: BlueprintRequest): Promise<Blueprint | null> {
    if (!this.active) return null;

    const requirements = request.requirements.filter((item) => item.trim().length > 0);
    const architecture: Blueprint["architecture"] = {
      components: requirements.map((item) => `component:${item}`),
      interfaces: requirements.map((item) => `contract:${item}`),
      dataFlow: requirements.length > 1 ? requirements.slice(0, -1).map((item, index) => `${item}->${requirements[index + 1]}`) : [],
    };

    const blueprint: Blueprint = {
      id: `bp-${Date.now()}`,
      name: request.name,
      requirements,
      architecture,
      timestamp: Date.now(),
      execution: "derived_from_request",
    };

    this.blueprints.push(blueprint);
    aeternumHortaCore.set(`${this.id}.last`, blueprint);
    await aeternumBus.emit("evolution.blueprint.created", blueprint);
    return blueprint;
  }

  list(): Blueprint[] {
    return [...this.blueprints];
  }
}

export const blueprintModule = new BlueprintModule();
