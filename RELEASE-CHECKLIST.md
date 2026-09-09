# PY-AIEval v0.1 Release Checklist

**State:** staged inside the private Nova Labs repository and mirrored byte-for-byte into `mateopalau/nova-py-aieval`. The publication repository is still private and has not yet been transferred to `Nova-Labs-Paraguay`; this file does not claim that a public `v0.1.0` release exists.

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

## Verified staged source

GitHub Actions run `34395177934` completed successfully on 2026-09-09 against Nova Labs `main` commit `11a8f58351c4d7ba9e95d0a193e34daa62bec0c1`.

- [x] Root TypeScript check passes.
- [x] Complete root unit/source-integrity suite passes.
- [x] Standalone package installs successfully.
- [x] Standalone package TypeScript check passes.
- [x] Standalone package tests reproduce the exact Stage 1 artifact.
- [x] `npm run verify:release` passes with no missing/unexpected files or forbidden content.
- [x] Nova Labs production build passes.

## Verified publication mirror

The mirrored package in `mateopalau/nova-py-aieval` is currently private.

- [x] All 36 allowlisted release files are present and no corporate/private files were copied.
- [x] Publication mirror tree matches the staged source package tree: `77d40822070871fcc85e5412057b7d0d7f4484e7`.
- [x] Publication mirror CI run `34394683064` passes install, typecheck, tests and `verify:release`.
- [x] Current publication mirror head: `9acfb29f34fe97a5a0fd238c76de5e21c184dc73`.

## External publication — intentionally pending

- [ ] Transfer `mateopalau/nova-py-aieval` to `Nova-Labs-Paraguay/nova-py-aieval`.
- [ ] Change repository visibility to public.
- [ ] Verify repository from an unauthenticated/public view.
- [ ] Create immutable tag `v0.1.0`.
- [ ] Create GitHub Release for `v0.1.0`.
- [ ] Verify release URL and tagged tree from a public view.
- [ ] Update `https://www.novalabs.com.py/investigacion/benchmark` with the live repository/release links and exact public-release status.
- [ ] Verify the canonical page after deployment.
- [ ] Publish the technical announcement only after the preceding public steps are complete.

## Deferred by design

- Hugging Face upload: deferred because v0.1.0 is not a model or dataset release.
- Zenodo/DOI: deferred until scholarly archival citation materially benefits a later benchmark/report release.
- Public leaderboard: blocked until stable tasksets, contamination gates and same-protocol model runs justify one.
