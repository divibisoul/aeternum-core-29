# SOUL Fusion Contract v1

Status: active additive federation contract.

## Purpose
SOUL is one logical cognitive organism composed of six independent AI nuclei. Fusion means shared identity, discovery, routing, authorization, observability and cooperative execution. It does not mean collapsing the nuclei into one implementation.

## Nuclei
N01, N02, N03, N04, N05, N06.

## Ownership
Each nucleus retains ownership of its own agents, tools, providers, memory, UI/domain modules and native capabilities. Other nuclei may invoke those capabilities through Soul Mesh but may not silently reimplement or take ownership of them.

## Reference nucleus
N01 is the communication/host reference and universal gateway. It may discover, route and delegate to the owning nucleus. N01 is not the universal owner of every capability.

## Unified logical surface
The fused system exposes one logical capability fabric while preserving six execution domains. A request may enter through N01, be delegated to any owning nucleus, invoke that nucleus's native runtime/tooling, and return a correlated result through the Mesh.

## Channels
Every nucleus has five logical IN channels and five logical OUT channels for the other five nuclei. Logical channel identity is independent of transport.

## Transports
Supported transport classes are IN_PROCESS, WEBVIEW_BRIDGE, LOOPBACK_HTTP, HTTP and REALTIME. Multiple transports may coexist. Negotiation and fallback must never remove or disable another native capability or transport.

## Fusion transaction
1. Discover capability metadata.
2. Resolve owner and compatible transport.
3. Authorize the request.
4. Dispatch to the destination runtime.
5. Execute the native handler/tool.
6. Return the original correlation identity in a structured result or error.
7. Make the result observable to the requester.

## Diagnostics
Ping and health indicate connectivity only. They do not prove functional AI-to-AI capability execution.

## Verification states
- VERIFIED: runtime execution or automated environment proved the behavior.
- IMPLEMENTED_UNVERIFIED: code is implemented but runtime proof is unavailable.
- MISSING: implementation is absent.

IMPLEMENTED_UNVERIFIED is never converted to VERIFIED without evidence.

## Non-destructive rule
Fusion is additive. Existing functionality is preserved. Compatibility adapters are preferred over removal or replacement. A failed test is a defect signal, not a reason to delete a capability.
