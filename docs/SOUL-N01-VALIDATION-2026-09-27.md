# N01 validation remediation — 2026-09-27

## Confirmed failures on main 462fc7d4fc95bdff3307649a3b0c9abd9cffe98d

- npm clean-install validation fails because package.json and package-lock.json are out of sync. Missing entries include @radix-ui/react-progress@1.1.16, zustand@5.0.15 and related Radix packages.
- SOUL Mesh peer-resilience test is timing-sensitive because it uses a 1ms cooldown and real Date.now().
- Web lint has one blocking prefer-const error in generated src/integrations/supabase/previewAuthStorage.ts.
- Android build fails inside android-actions/setup-android@v3 because its default package list includes the obsolete tools package.

## Remediation on branch

- The peer-resilience test now uses a deterministic 1000ms cooldown and the recorded timestamp from the state transition.
- The generated preview auth storage timer is a const initialized once before timeout cleanup.
- setup-android is configured with packages: platform-tools, while Android 36/build-tools 35/platform-tools are installed explicitly by the workflow.
- A branch-scoped npm lock repair workflow regenerates package-lock.json and verifies npm ci before persisting the lock.
