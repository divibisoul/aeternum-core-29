import {
  AETERNUM_8_MODULES,
  validateAeternumModuleGraph,
  type AeternumModuleDescriptor,
} from "@/lib/aeternum/AeternumModuleMap";

export type InfrastructureStatus =
  | "REAL"
  | "IMPLEMENTED"
  | "ADAPTER_READY"
  | "CONTRACT_VERIFIED"
  | "RUNTIME_UNVERIFIED"
  | "PENDING_REPO"
  | "PENDING_ADAPTER"
  | "UNMEASURABLE";

export type OctaSlotId = "G0"|"G1"|"G2"|"G3"|"G4"|"G5"|"G6"|"G7";

export interface InfrastructureNode {
  id: string;
  identity: string;
  layer: "SOUL"|"SARA"|"OCTACORE"|"AETERNUM"|"HORTACORE"|"MESH"|"VAGUS"|"ANDROID";
  sourceRepo: string;
  sourcePaths: string[];
  canonicalExecutionOwner: string;
  governanceAuthority: "SARA"|null;
  affinityHost: string;
  transport: string[];
  controlPlane: string;
  executionPlane: string[];
  status: InfrastructureStatus;
  evidence: string[];
  notes: string[];
}

export interface ClareiraConnection {
  source: string;
  target: string;
  capability: string;
  transport: "IN_PROCESS"|"SOUL_MESH"|"SARA_HTTP";
  status: InfrastructureStatus;
  evidence: string[];
}

export interface OctaCoreSlot {
  slot: OctaSlotId;
  nucleus: "SARA"|"N01"|"N02"|"N03"|"N04"|"N05"|"N06"|"N07";
  role: string;
  sourceRepo: string;
  status: InfrastructureStatus;
  executionBackends: string[];
  notes: string[];
}

export const OCTACORE_SLOTS: readonly OctaCoreSlot[] = [
  { slot:"G0", nucleus:"SARA", role:"regenerative compute kernel", sourceRepo:"divibisoul/SARA", status:"CONTRACT_VERIFIED", executionBackends:["SARA_HTTP"], notes:["SARA remains the only regenerative authority."] },
  { slot:"G1", nucleus:"N01", role:"edge ingress / host gateway kernels", sourceRepo:"divibisoul/aeternum-core-29", status:"IMPLEMENTED", executionBackends:["IN_PROCESS","SOUL_MESH"], notes:["Android host and N01 Mesh are retained as the edge boundary."] },
  { slot:"G2", nucleus:"N02", role:"conversation turn kernels", sourceRepo:"divibisoul/Eternium-", status:"CONTRACT_VERIFIED", executionBackends:["REMOTE_MESH"], notes:["N02 runtime exists; live transport remains environment-dependent."] },
  { slot:"G3", nucleus:"N03", role:"perception / multimodal preparation", sourceRepo:"divibisoul/nexus-aeternum-fusion", status:"CONTRACT_VERIFIED", executionBackends:["REMOTE_MESH"], notes:["N03 Mesh endpoint and audio capability registry are real."] },
  { slot:"G4", nucleus:"N04", role:"tools / documents / research", sourceRepo:"divibisoul/nextjs-ai-chatbots", status:"ADAPTER_READY", executionBackends:["REMOTE_MESH"], notes:["Octacore adapter must call declared executable N04 handlers only."] },
  { slot:"G5", nucleus:"N05", role:"inference / dispatch kernels", sourceRepo:"divibisoul/nextjs-ai-chatbot", status:"CONTRACT_VERIFIED", executionBackends:["REMOTE_MESH"], notes:["N05 canonical Mesh gateway is the execution boundary."] },
  { slot:"G6", nucleus:"N06", role:"cognition / session batching", sourceRepo:"divibisoul/nextjs-ai-chatbot-2000", status:"ADAPTER_READY", executionBackends:["REMOTE_MESH"], notes:["N06 canonical dispatcher remains authoritative."] },
  { slot:"G7", nucleus:"N07", role:"SuperGPU scheduler + Mesh router + correlation", sourceRepo:"divibisoul/Orquestrador-", status:"IMPLEMENTED", executionBackends:["IN_PROCESS","REMOTE_MESH"], notes:["Octacore is a processor surface over the existing N07 SuperGPU runtime; no second SuperGPU is created."] },
] as const;

export const INFRASTRUCTURE_NODES: readonly InfrastructureNode[] = [
  {
    id:"SOUL-N01", identity:"SOUL/Aeternum host", layer:"SOUL", sourceRepo:"divibisoul/aeternum-core-29",
    sourcePaths:["src/core/EventBus.ts","scripts/soul-mesh-server.mjs","src/core/mesh/SoulMeshRuntime.ts"],
    canonicalExecutionOwner:"N01", governanceAuthority:null, affinityHost:"Android/Web host",
    transport:["IN_PROCESS","HTTP","SUPABASE_REALTIME"], controlPlane:"VagusBus", executionPlane:["Soul Mesh","N01 in-process runtime"],
    status:"IMPLEMENTED", evidence:["N01 script Mesh gateway exists","N01 TS Mesh runtime exists"], notes:["Two Mesh-facing implementations are retained and must be reconciled at protocol level, not deleted."]
  },
  {
    id:"SARA", identity:"SARA regenerative authority", layer:"SARA", sourceRepo:"divibisoul/SARA",
    sourcePaths:["src/sara/service/http_api.py","src/sara/infra/vagus_bus.py","src/sara/regeneration/regenerative_loop.py"],
    canonicalExecutionOwner:"SARA", governanceAuthority:"SARA", affinityHost:"SARA service",
    transport:["SARA_HTTP","IN_PROCESS"], controlPlane:"VagusBus", executionPlane:["SARA regenerative runtime"],
    status:"CONTRACT_VERIFIED", evidence:["GET /health","/v1/capabilities","/v1/cycle","/v1/audit","/v1/regenerate","/v1/state","/v1/trace"], notes:["No other nucleus may implement regeneration."] 
  },
  {
    id:"OCTACORE", identity:"Octacore system processor", layer:"OCTACORE", sourceRepo:"divibisoul/Orquestrador-",
    sourcePaths:["octacore/types.go","octacore/processor.go","octacore/scheduler.go","octacore/http.go"],
    canonicalExecutionOwner:"N07", governanceAuthority:"SARA", affinityHost:"N07/Orquestrador",
    transport:["N07_HTTP","SOUL_MESH"], controlPlane:"VagusBus", executionPlane:["N07 SuperGPU","Remote Mesh"],
    status:"IMPLEMENTED", evidence:["Eight-slot inventory","parallel_group/barrier scheduler","token bucket","circuit breaker"], notes:["Software processor; not silicon CPU/GPU."] 
  },
  {
    id:"HORTACORE", identity:"HortaCore composition layer", layer:"HORTACORE", sourceRepo:"divibisoul/Orquestrador-",
    sourcePaths:["hortacore/hortacore.go","hortacore/fusion.go"],
    canonicalExecutionOwner:"N07", governanceAuthority:"SARA", affinityHost:"N07/Orquestrador",
    transport:["IN_PROCESS","REMOTE_MESH"], controlPlane:"VagusBus", executionPlane:["N07"], status:"CONTRACT_VERIFIED",
    evidence:["Five processor descriptors","SARA-backed ERU/Audit ownership"], notes:["Composition layer, not a replacement for Octacore or SARA."]
  },
  {
    id:"ANDROID-ADMIN", identity:"Soul Admin Plus", layer:"ANDROID", sourceRepo:"divibisoul/aeternum-core-29",
    sourcePaths:["soul-sentinel/app/src/main/java/com/divibisoul/soul/SoulAdminPlusActivity.kt","soul-sentinel/app/src/main/java/com/divibisoul/soul/runtime/SoulAdminPlusRuntime.kt"],
    canonicalExecutionOwner:"N01", governanceAuthority:"SARA", affinityHost:"Android",
    transport:["HTTPS","IN_PROCESS","SHIZUKU_OPTIONAL","ROOT_OPTIONAL"], controlPlane:"VagusBus", executionPlane:["N01","N07","SARA"], status:"IMPLEMENTED",
    evidence:["real SARA/N07 clients","Room/DataStore","Watchdog","Root/Shizuku gates"], notes:["Operational surface only; it does not become a second SARA."]
  },
] as const;

export const CLAREIRA_CONNECTIONS: readonly ClareiraConnection[] = [
  {
    source:"ProjetoClareira", target:"N01", capability:"neural.clareira.status|stimulus|decision",
    transport:"IN_PROCESS", status:"REAL",
    evidence:["ProjetoClareira concrete runtime","N01 Mesh runtime adapter"],
  },
  {
    source:"N01 Mesh", target:"remote peers", capability:"neural.clareira.*",
    transport:"SOUL_MESH", status:"CONTRACT_VERIFIED",
    evidence:["N01 SoulMeshCapabilityRegistry","N01 SoulMeshRuntime"],
  },
  {
    source:"N02", target:"Clareira/SARA frontier", capability:"/v1/clareira/audit",
    transport:"SARA_HTTP", status:"PENDING_ADAPTER",
    evidence:["Open N02 PR #16 declares implementation but E2/E3 distinction remains explicit"],
  },
];

export function validateInfrastructureMatrix(): string[] {
  const errors: string[] = [];
  if (OCTACORE_SLOTS.length !== 8) errors.push("OCTACORE_SLOT_COUNT");
  const expected = ["G0","G1","G2","G3","G4","G5","G6","G7"];
  if (OCTACORE_SLOTS.map(x => x.slot).join(",") !== expected.join(",")) errors.push("OCTACORE_SLOT_ORDER");
  if (OCTACORE_SLOTS[0].nucleus !== "SARA") errors.push("G0_MUST_BE_SARA");
  if (OCTACORE_SLOTS[7].nucleus !== "N07") errors.push("G7_MUST_BE_N07");
  if (OCTACORE_SLOTS.some(x => x.nucleus === "SARA" && x.slot !== "G0")) errors.push("SARA_MUST_ONLY_BE_G0");
  if (AETERNUM_8_MODULES.length !== 8) errors.push("AETERNUM_8_COUNT");
  const graphProblems = validateAeternumModuleGraph();
  errors.push(...graphProblems.map(error => "AETERNUM:"+error));
  const regen = CLAREIRA_CONNECTIONS.filter(x => x.capability.includes("regenerate"));
  if (regen.length) errors.push("CLAREIRA_MUST_NOT_OWN_REGENERATION");
  return errors;
}

export function getAeternumAuthority(module: AeternumModuleDescriptor): {
  executionOwner: string | null;
  governanceAuthority: "SARA" | null;
  legacyOwner: string;
} {
  const legacyOwner = module.owner;
  const executionOwner = module.executionOwner ?? (legacyOwner === "N07_SARA" ? "N07" : legacyOwner);
  const governanceAuthority = module.governanceAuthority ?? (legacyOwner === "N07_SARA" ? "SARA" : null);
  return { executionOwner, governanceAuthority, legacyOwner };
}
