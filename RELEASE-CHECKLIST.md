# PY-AIEval v0.1 Release Checklist

**State:** staged inside the private Nova Labs repository and mirrored into `mateopalau/nova-py-aieval`. The publication repository is still private and has not yet been transferred to `Nova-Labs-Paraguay`; this file does not claim that a public `v0.1.0` release exists.

## Package gates

- [x] Purpose-specific allowlist export prepared.
- [x] Corporate website source excluded from the package.
- [x] Client data and private study data excluded.
- [x] Public development tasksets remain `rankable: false`.
- [x] No leaderboard is included.
- [x] No model-superiority or priority claim is included.
- [x] Stage 1 artifact is frozen with SHA-256 `4ffddc7fa09c5092258a632f79fb051e3b82ddbd142fad1383578a9c8491858d`.
- [x] Stage 1 is labeled as a five-item development-only system baseline with zero model-training compute.
- [x] Raw system prompt is not persisted in the released run artifact.
- [x] Standalone CI definition includes clean install, typecheck, tests and release-integrity verification.
- [x] Citation, methodology, limitations, contamination and reproducibility documentation are included.
- [x] Bug and replication/critique issue templates are included.
- [x] Secret/private-content scan and exact staged inventory gate are included.
- [x] Press-kit inventory claim is regression-tested against `RELEASE-MANIFEST.json`.
- [x] `RELEASE-MANIFEST.json` is CI-bound to version `0.1.0`, source commit, artifact SHA, dependency-lock SHA, inventory SHA, canonical URL, target repository and `releaseState: staged`.
- [x] `package.json` version must match the release manifest version.
- [x] npm registry publication is blocked with `package.json` → `private: true`; v0.1.0 is distributed as a source repository/release, not an npm package.
- [x] `verify:release` and tests fail if the npm publication block is removed.
- [x] `package-lock.json` lockfile v3 is versioned and its SHA-256 is frozen to `572ad3d67ffec0fe1caa8234e73f421a013bc3da383fe6bd621e94a2d846688d`.
- [x] CI and reproducibility instructions use `npm ci`, not dependency-resolving `npm install`.
- [x] `CITATION.cff` is CI-bound to the intended canonical URL/repository/version and cannot contain `date-released` or claim an existing release while the manifest is staged.

## Verified staged source

A full Nova Labs `main` verification has passed after the inventory-consistency guard was merged.

- [x] Root TypeScript check passes.
- [x] Complete root unit/source-integrity suite passes.
- [x] Standalone package installs from the frozen lockfile.
- [x] Standalone package TypeScript check passes.
- [x] Standalone package tests reproduce the exact Stage 1 artifact.
- [x] `npm run verify:release` passes with no missing/unexpected files, forbidden content, manifest drift, citation-state drift, npm-publish exposure or dependency-lock drift.
- [x] Nova Labs production build passes.

## Publication mirror

The mirrored package in `mateopalau/nova-py-aieval` is currently private.

- [x] All 37 allowlisted release files are present and no corporate/private files were copied.
- [x] Source-package and mirror tree identity is checked during staging and must be re-verified immediately before tagging.
- [x] Mirror CI uses Node 22 + `npm ci` and passes typecheck, tests and `verify:release`.

## External publication — intentionally pending

- [ ] Transfer `mateopalau/nova-py-aieval` to `Nova-Labs-Paraguay/nova-py-aieval`.
- [ ] Change repository visibility to public.
- [ ] Re-verify source-package and mirror tree identity.
- [ ] Verify repository from an unauthenticated/public view.
- [ ] Set the actual public release date in `CITATION.cff` only after the release exists.
- [ ] Create immutable tag `v0.1.0`.
- [ ] Create GitHub Release for `v0.1.0`.
- [ ] Verify release URL and tagged tree from a public view.
- [ ] Update `https://www.novalabs.com.py/investigacion/benchmark` with the live repository/release links and exact public-release status.
- [ ] Verify the canonical page after deployment.
- [ ] Publish the technical announcement only after the preceding public steps are complete.

## Deferred by design

- npm registry publication: intentionally blocked for v0.1.0; GitHub source/release is the approved distribution channel.
- Hugging Face upload: deferred because v0.1.0 is not a model or dataset release.
- Zenodo/DOI: deferred until scholarly archival citation materially benefits a later benchmark/report release.
- Public leaderboard: blocked until stable tasksets, contamination gates and same-protocol model runs justify one.

Historical tags must never be force-updated.
