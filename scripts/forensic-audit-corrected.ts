import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

type Status =
  | "ACTIVE"
  | "INACTIVE"
  | "BURIED"
  | "DISCONNECTED"
  | "INCOMPLETE"
  | "SIMULATED"
  | "FOUND_IN_MAIN"
  | "FOUND_IN_BRANCH"
  | "FOUND_IN_HISTORY"
  | "FOUND_IN_PR"
  | "FOUND_IN_STASH"
  | "NOT_FOUND_ANYWHERE";

type Action =
  | "VERIFY"
  | "REACTIVATE"
  | "REINTEGRATE"
  | "COMPLETE"
  | "FIX"
  | "UPDATE"
  | "RECOVER_FROM_GIT"
  | "REQUEST_ARTIFACT";

export interface Component {
  id: string;
  group: string;
  aliases: string[];
}

export interface ForensicResult {
  id: string;
  group: string;
  status: Status;
  foundIn: {
    mainPaths: string[];
    branches: string[];
    commits: string[];
    prs: number[];
    stash: string[];
    backups: string[];
  };
  signals: {
    declaration: string[];
    registration: string[];
    boot: string[];
    execution: string[];
    communication: string[];
    heartbeat: string[];
    result: string[];
  };
  dependencies: string[];
  callers: string[];
  evidence: string[];
  action: Action;
  scannedAt: string;
}

export const COMPONENTS: Component[] = [
  ...["codex","blueprint","eru","audit","guide"].map(id => ({ id, group:"hortacore", aliases:[] })),
  ...["nvod","vagus_gateway","horta_orchestrator"].map(id => ({ id, group:"communication", aliases:[] })),
  { id:"geminiServices", group:"controller", aliases:["gemini-services","GeminiServices"] },
  ...[
    "acai","mpvs","multimodal_cortex","autonomous_embodiment","neural_forge","asc",
    "biomolecular_designer","reality_synthesis","strategic_planning","csae","dcrs",
    "adaptation_module","scre","ecas","eus","mlfg","emergent_cognition","bnc_v2",
    "skill_acquisition","uci","ethical_governance","strategic_defense","existential_safety",
    "einstein_reasoning","einstein_code","einstein_quantum","cot_arhd","cot_drc","cot_area"
  ].map(id => ({ id, group:"module", aliases:[] })),
  ...["engineering_panel","hortacore_widget","metrics_widget","heartbeat_widget"]
    .map(id => ({ id, group:"panel", aliases:[] })),
  ...["sara_fusion_engine","fusion_matrix","core_values","quantum_processor"]
    .map(id => ({ id, group:"sara_chimera", aliases:[] })),
];

export const ADDITIONAL_COMPONENTS: Component[] = [
  "OctaCore","SOUL","N01","N02","N03","N04","N05","N06","N07","SARA",
  "GovernedSARA","RegenerativeMemory","TemporalVectorDB","DecisionTrace",
  "Provenance","EthicalFilterChain","CycleAuditor","QuantumCrawler","MMD",
  "RGO","Tríade","TechHorizonScanner","LegalAI","SimulationLayer",
  "DecisionTracer","Funções PLUS","Ferramentas"
].map(id => ({ id, group:"additional", aliases:[] }));

const ROOT = process.cwd();
const ALL = [...COMPONENTS, ...ADDITIONAL_COMPONENTS];

function run(cmd: string, args: string[]): string {
  try {
    return execFileSync(cmd, args, { cwd: ROOT, encoding: "utf8", stdio:["ignore","pipe","pipe"] }).trim();
  } catch {
    return "";
  }
}

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes:true })) {
    if ([".git","node_modules","dist","build"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(path.relative(ROOT, full));
  }
  return out;
}

const files = walk(ROOT);

function isAuditArtifact(file: string): boolean {
  const normalized = file.replace(/\\/g, "/");
  return normalized.startsWith("docs/forensics/")
    || /(^|/)scripts/forensic-/.test(normalized)
    || /(^|/)\\.github/workflows/n01-forensic-/.test(normalized)
    || normalized.startsWith("artifacts/");
}

const runtimeFiles = files.filter(file =>
  !isAuditArtifact(file)
  && /\\.(ts|tsx|js|mjs|cjs|py|go|kt|java)$/.test(file)
);

const textCache = new Map<string,string>();
function readText(file: string): string {
  if (!textCache.has(file)) {
    try { textCache.set(file, fs.readFileSync(path.join(ROOT,file),"utf8")); }
    catch { textCache.set(file,""); }
  }
  return textCache.get(file)!;
}

function normalizedTokens(c: Component): string[] {
  const base = c.id.replace(/[_-]+/g," ");
  const pascal = base.split(/\s+/).filter(Boolean).map(s => s[0]?.toUpperCase()+s.slice(1)).join("");
  return [c.id, base, pascal, c.id.toUpperCase(), ...c.aliases].filter(Boolean);
}

function contentMatches(tokens: string[], candidates: string[]): string[] {
  const result:string[] = [];
  for (const file of candidates) {
    const text = readText(file);
    if (!text) continue;
    if (tokens.some(t => text.toLowerCase().includes(t.toLowerCase()))) result.push(file);
  }
  return result.slice(0,30);
}

function signalMatches(tokens:string[], terms:string[]):string[] {
  const hits:string[] = [];
  for (const file of runtimeFiles) {
    const text = readText(file);
    if (!text) continue;
    const low=text.toLowerCase();
    if (tokens.some(t=>low.includes(t.toLowerCase())) && terms.some(t=>low.includes(t))) hits.push(file);
  }
  return hits.slice(0,20);
}

function classify(r: ForensicResult): Status {
  if (r.foundIn.mainPaths.length === 0) {
    if (r.foundIn.prs.length) return "FOUND_IN_PR";
    if (r.foundIn.branches.length) return "FOUND_IN_BRANCH";
    if (r.foundIn.commits.length) return "FOUND_IN_HISTORY";
    if (r.foundIn.stash.length) return "FOUND_IN_STASH";
    return "NOT_FOUND_ANYWHERE";
  }
  const s=r.signals;
  const execution=s.execution.length>0;
  const communication=s.communication.length>0;
  const heartbeat=s.heartbeat.length>0;
  const boot=s.boot.length>0;
  const registration=s.registration.length>0;
  if (execution && communication && heartbeat && boot && registration) return "ACTIVE";
  if (registration || boot || execution) return "INACTIVE";
  return "FOUND_IN_MAIN";
}

const branchText = run("git",["for-each-ref","--format=%(refname:short)","refs/heads","refs/remotes"]);
const branches = branchText.split("\n").map(s=>s.trim()).filter(Boolean);

function gitPathHistory(tokens:string[]):string[] {
  const out = new Set<string>();
  for (const token of tokens.slice(0,3)) {
    const v = run("git",["log","--all","--full-history","--name-only","--format=","--",`**/*${token}*`]);
    v.split("\n").map(s=>s.trim()).filter(Boolean).slice(0,40).forEach(x=>out.add(x));
  }
  return [...out].slice(0,40);
}

function branchEvidence(tokens:string[]):string[] {
  const out = new Set<string>();
  for (const branch of branches.slice(0,300)) {
    const v = run("git",["grep","-Il","--ignore-case",tokens[0],branch,"--","src","scripts","docs"]);
    if (v) out.add(branch);
  }
  return [...out].slice(0,30);
}

function prEvidence(tokens:string[]):number[] {
  const q=tokens[0];
  const raw=run("gh",["pr","list","--state","all","--search",q,"--json","number,title","--limit","30"]);
  if (!raw) return [];
  try {
    const arr=JSON.parse(raw) as Array<{number:number}>;
    return arr.map(x=>x.number).filter(Number.isFinite);
  } catch { return []; }
}

const results:ForensicResult[] = [];
for (const c of ALL) {
  const tokens=normalizedTokens(c);
  const sourceFiles=runtimeFiles;
  const mainPaths=contentMatches(tokens, sourceFiles);
  const declaration=contentMatches(tokens, sourceFiles.filter(f=>new RegExp(`(?:${tokens.join("|")})`, "i").test(path.basename(f))));
  const registration=signalMatches(tokens,["register","registry","subscribe","registercomponent","registermodule"]);
  const boot=signalMatches(tokens,["initialize","init()","start()","boot","startup"]);
  const execution=signalMatches(tokens,["execute","dispatch","process","run","handle"]);
  const communication=signalMatches(tokens,["eventbus","nvod","mesh","publish","send","subscribe"]);
  const heartbeat=signalMatches(tokens,["heartbeat","heart-beat","beat"]);
  const resultSignals=signalMatches(tokens,["result","response","metrics","status"]);
  const branchesFound=branchEvidence(tokens);
  const commits=gitPathHistory(tokens);
  const prs=prEvidence(tokens);
  const stashRaw=run("git",["stash","list"]);
  const stash=stashRaw && tokens.some(t=>stashRaw.toLowerCase().includes(t.toLowerCase())) ? stashRaw.split("\n").slice(0,10) : [];
  const backups=files.filter(f=>/backup|archive|recovery|forensic/i.test(f) && tokens.some(t=>f.toLowerCase().includes(t.toLowerCase()))).slice(0,20);
  const dependencies=contentMatches(tokens,sourceFiles).filter(f=>/package|import|require|dependency|contract/i.test(readText(f))).slice(0,20);
  const callers=contentMatches(tokens,sourceFiles).filter(f=>!declaration.includes(f)).slice(0,20);
  const r:ForensicResult={
    id:c.id, group:c.group, status:"NOT_FOUND_ANYWHERE",
    foundIn:{mainPaths,branches:branchesFound,commits,prs,stash,backups},
    signals:{declaration,registration,boot,execution,communication,heartbeat,result:resultSignals},
    dependencies,callers,evidence:[],
    action:"REQUEST_ARTIFACT",scannedAt:new Date().toISOString()
  };
  r.status=classify(r);
  r.action=r.status==="ACTIVE" ? "VERIFY" :
    r.status==="FOUND_IN_MAIN" ? "REINTEGRATE" :
    r.status==="INACTIVE" ? "REACTIVATE" :
    r.status==="FOUND_IN_BRANCH" || r.status==="FOUND_IN_HISTORY" || r.status==="FOUND_IN_PR" || r.status==="FOUND_IN_STASH" ? "RECOVER_FROM_GIT" :
    "REQUEST_ARTIFACT";
  r.evidence.push(`mainPaths=${mainPaths.length}; branches=${branchesFound.length}; commits=${commits.length}; prs=${prs.length}; stash=${stash.length}; backups=${backups.length}`);
  results.push(r);
}

const report={
  schema:"aeternum.forensic-audit.v2",
  generatedAt:new Date().toISOString(),
  repository:run("git",["config","--get","remote.origin.url"]),
  head:run("git",["rev-parse","HEAD"]),
  branch:process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || run("git",["branch","--show-current"]),
  totalConfirmed:COMPONENTS.length,
  totalAdditional:ADDITIONAL_COMPONENTS.length,
  totalScanned:ALL.length,
  limitations:[
    "This execution scans the checked-out Git object graph exposed to the runner; remote tag enumeration is represented only if refs are fetched.",
    "GitHub PR search is best-effort through gh and is recorded as empty when unavailable.",
    "Backup discovery is limited to files present in the checked-out workspace.",
    "Static evidence never upgrades a component to runtime-proven unless registration, boot, execution, communication and heartbeat signals are all present."
  ],
  results
};

fs.mkdirSync(path.join(ROOT,"artifacts"),{recursive:true});
fs.writeFileSync(path.join(ROOT,"artifacts/forensic-audit-report.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({
  generatedAt:report.generatedAt, head:report.head, branch:report.branch,
  totalScanned:report.totalScanned,
  active:results.filter(r=>r.status==="ACTIVE").length,
  foundInMain:results.filter(r=>r.status==="FOUND_IN_MAIN").length,
  inactive:results.filter(r=>r.status==="INACTIVE").length,
  history:results.filter(r=>["FOUND_IN_BRANCH","FOUND_IN_HISTORY","FOUND_IN_PR","FOUND_IN_STASH"].includes(r.status)).length,
  absent:results.filter(r=>r.status==="NOT_FOUND_ANYWHERE").length,
  report:"artifacts/forensic-audit-report.json"
},null,2));
