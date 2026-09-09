# PY-AIEval v0.1 Release Checklist

**State:** staged inside the private Nova Labs repository. This file does not claim that the public repository or `v0.1.0` tag already exists.

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

## Verified on staged head

GitHub Actions run `34363633697` completed successfully on 2026-09-09 with all verification steps green.

- [x] Root TypeScript check passes.
- [x] Complete root unit/source-integrity suite passes.
- [x] Standalone package installs successfully.
- [x] Standalone package TypeScript check passes.
- [x] Standalone package tests reproduce the exact Stage 1 artifact.
- [x] `npm run verify:release` passes with no missing/unexpected files or forbidden content.
- [x] Nova Labs production build passes.

## External publication — intentionally pending

- [ ] Create public repository `Nova-Labs-Paraguay/nova-py-aieval`.
- [ ] Copy only this staged package into the public repository.
- [ ] Run the same CI in the public repository.
- [ ] Create immutable tag `v0.1.0`.
- [ ] Create GitHub Release for `v0.1.0`.
- [ ] Verify repository/release URLs from an unauthenticated/public view.
- [ ] Update `https://www.novalabs.com.py/investigacion/benchmark` with the live repository/release links and exact public-release status.
- [ ] Verify the canonical page after deployment.
- [ ] Publish the technical announcement only after the preceding public steps are complete.

## Deferred by design

- Hugging Face upload: deferred because v0.1.0 is not a model or dataset release.
- Zenodo/DOI: deferred until scholarly archival citation materially benefits a later benchmark/report release.
- Public leaderboard: blocked until stable tasksets, contamination gates and same-protocol model runs justify one.
