# N01 Mesh container deployment

## Verified repository boundary

The N01 runtime is already executable with `npm run mesh:n01`. Its current HTTP gateway exposes `GET /mesh/health` and `POST /api/soul-mesh`. Before this deployment branch, the repository had no Dockerfile, Compose file, provider deployment manifest, or container-publication workflow. The peer deployment registry currently records N01 as `LOCAL HOST; cross-peer E2E pending`; that is not evidence of a public service.

This change packages the existing Node gateway without replacing the application or changing the Mesh contract. The PR workflow builds the actual container and calls the live `/mesh/health` endpoint inside it. The GHCR publication job runs only on `main` (push or manual dispatch on `main`); a PR build does not publish or deploy a public service.

## Container contract

- Runtime entrypoint: `node scripts/soul-mesh-server-entry.mjs`
- Listener: `SOUL_MESH_N01_PORT`, then host-provided `PORT`, then `8080`
- Health check: `GET /mesh/health`; the response must have `ok: true` and `nucleus: "N01"`
- Mesh request route: `POST /api/soul-mesh`
- Published image after the publishing workflow is enabled on `main`: `ghcr.io/divibisoul/aeternum-core-29:main`, plus an immutable commit-SHA tag

## Required runtime configuration for a real N01↔N02 E2E

Configure these in the hosting platform, not in this repository or image:

1. `SOUL_MESH_SECRET`: a high-entropy shared HMAC secret. It must exactly match the GitHub Actions secret `SOUL_MESH_HMAC_SECRET` in `divibisoul/Eternium-`. Do not use a committed placeholder or log the value.
2. `SOUL_MESH_N02_URL`: the real reachable base URL of the N02 runtime, with no trailing `/api/soul-mesh` path. N01 appends that route when forwarding. This is required for the N01→N02 half of the bidirectional gate.
3. The hosting platform must route public HTTP traffic to the container port. Do not publish the service before the HMAC secret is configured.

In `divibisoul/Eternium-`, configure `SOUL_MESH_N01_URL` as a repository/environment Actions variable whose value is the actual public base URL of this running N01 gateway. The gate appends `/api/soul-mesh`, so the value must be an origin/base URL, not a route URL. Keep `SOUL_MESH_HMAC_SECRET` in GitHub Actions Secrets, not Variables.

The live gate also sends real N02 capabilities by default (`ai.generate`, `ai.multimodal`, and `cognitive-processing`). N02 therefore needs a reachable runtime, the reciprocal Mesh endpoint configuration, the same HMAC secret, and valid server-side provider credentials for its real inference path. A health response alone does not prove those capabilities or the bidirectional integration.

## What this does not claim

Building or publishing a container is not the same as deploying it. This PR does not invent a hostname, create an external hosting account, or report a live endpoint. A Docker-capable host must run the image and return a real URL before `SOUL_MESH_N01_URL` can be set and the N02↔N01 live E2E gate can pass. The host deployment and its runtime variables are external to GitHub source control.
