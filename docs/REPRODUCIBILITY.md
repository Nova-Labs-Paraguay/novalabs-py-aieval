# Reproducibility

Use Node 22 and the versioned npm lockfile. Run `npm ci`, `npm run typecheck`, `npm test`, and `npm run verify:release`.

The v0.1.0 dependency graph is frozen in `package-lock.json` (lockfile v3) with SHA-256 `572ad3d67ffec0fe1caa8234e73f421a013bc3da383fe6bd621e94a2d846688d`. `verify:release` rejects lockfile drift, package identity/version drift, unexpected inventory changes and removal of the npm-publication block.

The Stage 1 artifact must validate to SHA-256 `4ffddc7fa09c5092258a632f79fb051e3b82ddbd142fad1383578a9c8491858d`. Raw system prompts are not persisted in run manifests; only `systemPromptHash` is retained.
