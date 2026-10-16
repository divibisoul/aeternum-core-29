# N01 Mesh: container, health check and free publication path

## What this stage delivers

N01 runs the existing Mesh gateway through `node scripts/soul-mesh-server-entry.mjs`. The container does not replace the web app, native agent registry, Mesh protocol or existing N01-to-N02 route.

- Listener: `SOUL_MESH_N01_PORT`, then `PORT`, then `8080`.
- Health endpoint: `GET /mesh/health`; it must return HTTP success with `ok: true` and `nucleus: "N01"`.
- Mesh endpoint: `POST /api/soul-mesh`.
- External provider catalog: `integrations/soul-25-augmentation.json`.
- All 25 public source revisions are pinned. The nine native SOUL peers and native authority are preserved.
- Providers remain `PROJECTED` until a provider-level execution has been observed. The N01 caller requires a registered N07 adapter operation and a canonical N07 result with state `PASS`; a health check or catalog entry does not prove execution.

## Build and verify without buying a domain

GitHub Actions builds the actual Docker image on pull requests and starts it locally on the runner. The gate repeatedly calls `/mesh/health` and fails unless the response identifies N01. Nothing is published from a pull request.

After the PR is merged, a push to `main` runs the same smoke test first. Only if it passes does the workflow publish to GitHub Container Registry (GHCR) using the built-in `GITHUB_TOKEN`; there is no paid domain or paid package required.

Expected image tags after a successful publish on `main`:

- `ghcr.io/divibisoul/aeternum-core-29:main`
- `ghcr.io/divibisoul/aeternum-core-29:sha-<commit>`

The repository must be allowed to publish packages. This workflow does not change package visibility or declare that a public host has been provisioned. Image publication is different from deployment.

## Configuration required for real inter-nucleus traffic

Keep secrets out of source files and container layers.

- `SOUL_MESH_SECRET`: high-entropy HMAC secret used by the N01 ingress. It must match the reciprocal Mesh secret configured for the peer.
- `SOUL_MESH_N07_URL`: real reachable base URL of the N07 gateway for external federation calls. N01 sends a signed `soul-mesh/1` request through its authenticated relay.
- `SOUL_MESH_N02_URL`: required for the existing N01-to-N02 capability route.
- `SOUL_MESH_HMAC_SECRET` and the appropriate peer URL belong in the respective GitHub Actions Secrets/Variables or in the chosen host's runtime configuration, not in this repository.

A GitHub-hosted workflow runner can prove a local container build and health endpoint. It cannot create a persistent public N01/N07 service URL by itself. Before claiming live cross-nucleus execution, deploy the images on an available free host or self-hosted machine, set the real URLs and matching secrets, then run the bidirectional HMAC/correlation and provider execution checks.

## Current external-provider activation policy

N01 and N07 share an explicit provider registry. Current N01 state:

- 16 providers have registered adapter operations in N07.
- Ray is listed as `EXPANSION_ONLY` and is not activated through the canonical registry.
- Eight other catalog entries have no N07 adapter registration and therefore return an explicit blocked state.
- The 16 registered adapters are still disabled by default; activation requires an explicit `SOUL_EXTERNAL_EXECUTE_<PROVIDER>` runtime setting on N07, an exact owner and pinned-revision match, and a real provider result with state `PASS`.

This is intentional fail-closed behavior, not a claim that 16 live provider integrations have already passed end-to-end tests.
