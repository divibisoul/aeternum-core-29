# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed.

## SOUL Mesh N01

This repository contains the N01 coordination layer for the seven-nucleus Soul system (N01..N07). Existing UI and bridge code remain intact. The executable Mesh gateway is started with:

```sh
npm run mesh:n01
```

Default listener: `0.0.0.0:8080`.

### Mesh endpoints

- `GET /mesh/health`
- `GET /mesh/discovery`
- `POST /mesh/register`
- `POST /mesh/in`
- `POST /mesh/out`

Configure peer endpoints with `SOUL_MESH_N02_URL` through `SOUL_MESH_N07_URL`. Configure `SOUL_MESH_SECRET` to enable HMAC-SHA256 envelope authentication.

N01 provides discovery, registration, delegation, retry/circuit protection and ordered `mesh.combo` workflows. Specialized capabilities remain owned by their respective nuclei; N01 orchestrates rather than replacing them.

To run the N01/N07 probe:

```sh
SOUL_MESH_N07_URL=http://<n07-host>:<port> npm run mesh:health
```

The probe only reports N01↔N07 as successful when the response identity and correlation ID are correct.

See `MESH_STATUS.md` for the acceptance criteria and current implementation boundary.

## What technologies are used for this project?

This project is built with Vite, TypeScript, React, shadcn-ui and Tailwind CSS.

## How can I deploy this project?

Open the Lovable project and publish it using the deployment controls provided there.
