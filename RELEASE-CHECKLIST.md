# PY-AIEval v0.1 Release Checklist

**State:** published. The public repository is `Nova-Labs-Paraguay/novalabs-py-aieval` and the release is `PY-AIEval-v0.1.0` (2026-10-03). The tag points at commit `3d9b1e0e604216180961869108156e1458d336cb`. v0.1.0 has no DOI and is not published to npm.

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
- [x] Standalone CI definition includes install, typecheck, tests and release-integrity verification.
- [x] Citation, methodology, limitations, contamination and reproducibility documentation are included.
- [x] Bug and replication/critique issue templates are included.
- [x] Secret/private-content scan and exact staged inventory gate are included.
- [x] Press-kit inventory claim is regression-tested against `RELEASE-MANIFEST.json`.
- [x] `RELEASE-MANIFEST.json` is CI-bound to version `0.1.0`, source commit, artifact SHA, inventory SHA, canonical URL, target repository and `releaseState: staged`.
- [x] `package.json` version must match the release manifest version.
- [x] npm registry publication is blocked with `package.json` → `private: true`; v0.1.0 is distributed as a source repository/release, not an npm package.
- [x] `verify:release` and tests fail if the npm publication block is removed.
- [x] `CITATION.cff` is CI-bound to the intended canonical URL/repository/version and cannot contain `date-released` or claim an existing release while the manifest is staged.

## Verified staged source

A full Nova Labs `main` verification has passed after the inventory-consistency guard was merged.

- [x] Root TypeScript check passes.
- [x] Complete root unit/source-integrity suite passes.
- [x] Standalone package installs successfully.
- [x] Standalone package TypeScript check passes.
- [x] Standalone package tests reproduce the exact Stage 1 artifact.
- [x] `npm run verify:release` passes with no missing/unexpected files, forbidden content, manifest drift, citation-state drift or npm-publish exposure.
- [x] Nova Labs production build passes.

## Publication mirror

The mirrored package in `mateopalau/nova-py-aieval` is currently private.

- [x] All 36 allowlisted release files are present and no corporate/private files were copied.
- [x] Source-package and mirror tree identity is checked during staging and must be re-verified immediately before tagging.
- [x] Mirror CI passes install, typecheck, tests and `verify:release`.

## External publication

- [x] Move the repository to `Nova-Labs-Paraguay` (published as `Nova-Labs-Paraguay/novalabs-py-aieval`; the planned name `nova-py-aieval` was not used).
- [x] Change repository visibility to public.
- [x] Verify repository and tagged tree from an unauthenticated/public view (tag `PY-AIEval-v0.1.0` resolves to `3d9b1e0`, identical to the staged package apart from formatting of three files).
- [x] Set the actual public release date in `CITATION.cff` (`2026-10-03`).
- [x] Create tag `PY-AIEval-v0.1.0` (lightweight tag; it is never moved, and a correction ships as a new version).
- [x] Create GitHub Release `PY-AIEval-v0.1.0`.
- [ ] Verify the release page and its notes from a public view.
- [x] Update `https://www.novalabs.com.py/investigacion/benchmark` with the live repository/release links and exact public-release status (source updated; deployment pending).
- [ ] Verify the canonical page after deployment.
- [ ] Publish the technical announcement only after the preceding public steps are complete.

## Deferred by design

- npm registry publication: intentionally blocked for v0.1.0; GitHub source/release is the approved distribution channel.
- Hugging Face upload: deferred because v0.1.0 is not a model or dataset release.
- Zenodo/DOI: deferred until scholarly archival citation materially benefits a later benchmark/report release.
- Public leaderboard: blocked until stable tasksets, contamination gates and same-protocol model runs justify one.

Historical tags must never be force-updated.
