import { AETERNUM_8_MODULES } from "./AeternumModuleMap.ts";
import type { AeternumModuleDescriptor, AeternumModuleId } from "./AeternumTypes.ts";

export type FunctionalAuthorityRole =
  | "ANCHOR"
  | "DEPENDENCY"
  | "EXECUTOR"
  | "GOVERNOR"
  | "ORCHESTRATOR"
  | "MEMORY";

export interface FunctionalAuthorityRecord {
  moduleId: AeternumModuleId;
  executionOwner: AeternumModuleDescriptor["executionOwner"];
  governanceAuthority: AeternumModuleDescriptor["governanceAuthority"];
  directDependencies: AeternumModuleId[];
  directDependents: AeternumModuleId[];
  transitiveDependents: AeternumModuleId[];
  connectionScore: number;
  roles: FunctionalAuthorityRole[];
  authorityPath: AeternumModuleId[];
}

/**
 * Functional authority is resolved from real module connections, not from a
 * hard-coded global ranking.
 *
 * The record keeps three distinct dimensions:
 * - executionOwner: who runs the capability;
 * - governanceAuthority: who may govern/validate it;
 * - connection structure: which modules are functional anchors/dependencies.
 *
 * This preserves native ownership while exposing the stronger functional
 * anchors that emerge from the AETERNUM dependency graph.
 */
export function resolveFunctionalAuthority(
  modules: readonly AeternumModuleDescriptor[] = AETERNUM_8_MODULES,
): FunctionalAuthorityRecord[] {
  const byId = new Map(modules.map((module) => [module.id, module]));
  if (byId.size !== modules.length) {
    throw new Error("AETERNUM_AUTHORITY_DUPLICATE_MODULE_ID");
  }

  const dependents = new Map<AeternumModuleId, AeternumModuleId[]>();
  for (const module of modules) dependents.set(module.id, []);

  for (const module of modules) {
    for (const dependency of module.dependencies) {
      if (!byId.has(dependency)) {
        throw new Error(`AETERNUM_AUTHORITY_UNKNOWN_DEPENDENCY:${module.id}->${dependency}`);
      }
      dependents.get(dependency)?.push(module.id);
    }
  }

  const memo = new Map<AeternumModuleId, AeternumModuleId[]>();
  const visiting = new Set<AeternumModuleId>();

  const collectTransitiveDependents = (id: AeternumModuleId): AeternumModuleId[] => {
    const cached = memo.get(id);
    if (cached) return [...cached];
    if (visiting.has(id)) {
      throw new Error(`AETERNUM_AUTHORITY_CYCLE_DETECTED:${id}`);
    }

    visiting.add(id);
    const found = new Set<AeternumModuleId>();
    for (const dependent of dependents.get(id) ?? []) {
      found.add(dependent);
      for (const nested of collectTransitiveDependents(dependent)) {
        found.add(nested);
      }
    }
    visiting.delete(id);

    const ordered = [...found].sort();
    memo.set(id, ordered);
    return ordered;
  };

  return modules
    .map((module) => {
      const directDependents = [...(dependents.get(module.id) ?? [])].sort();
      const transitiveDependents = collectTransitiveDependents(module.id);
      const connectionScore = directDependents.length * 2 + transitiveDependents.length;

      const roles: FunctionalAuthorityRole[] = [];
      if (directDependents.length > 0 && module.dependencies.length === 0) roles.push("ANCHOR");
      if (directDependents.length > 0) roles.push("DEPENDENCY");
      if (module.executionOwner) roles.push("EXECUTOR");
      if (module.governanceAuthority === "SARA") roles.push("GOVERNOR");
      if (module.id === "M2_ORCHESTRATION") roles.push("ORCHESTRATOR");
      if (module.id === "M8_GOVERNANCE_MEMORY") roles.push("MEMORY");

      return {
        moduleId: module.id,
        executionOwner: module.executionOwner,
        governanceAuthority: module.governanceAuthority,
        directDependencies: [...module.dependencies],
        directDependents,
        transitiveDependents,
        connectionScore,
        roles,
        authorityPath: functionalPath(module.id, byId),
      };
    })
    .sort((a, b) => b.connectionScore - a.connectionScore || a.moduleId.localeCompare(b.moduleId));
}

function functionalPath(
  id: AeternumModuleId,
  byId: ReadonlyMap<AeternumModuleId, AeternumModuleDescriptor>,
): AeternumModuleId[] {
  const chain: AeternumModuleId[] = [];
  const seen = new Set<AeternumModuleId>();
  let current: AeternumModuleId | undefined = id;

  while (current) {
    if (seen.has(current)) throw new Error(`AETERNUM_AUTHORITY_PATH_CYCLE:${current}`);
    seen.add(current);
    chain.unshift(current);
    const dependencies = byId.get(current)?.dependencies ?? [];
    current = [...dependencies].sort()[0];
  }

  return chain;
}

export function authorityForModule(
  id: AeternumModuleId,
  modules: readonly AeternumModuleDescriptor[] = AETERNUM_8_MODULES,
): FunctionalAuthorityRecord {
  const found = resolveFunctionalAuthority(modules).find((record) => record.moduleId === id);
  if (!found) throw new Error(`AETERNUM_MODULE_NOT_FOUND:${id}`);
  return found;
}
