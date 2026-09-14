# PY-AIEval v0.1

Metodología y harness abierto de Nova Labs para trabajo reproducible de evaluación de IA con foco en contexto paraguayo.

> **Estado:** development. Los tasksets públicos de v0.1 son `rankable: false`. Este repositorio no publica un leaderboard ni sostiene claims de superioridad entre modelos.

Incluye task schema, scorers deterministas, runner neutral a proveedor, manifests, SHA-256, gates de comparabilidad/contaminación/release, adapters OpenAI Responses + Hugging Face Chat, cuatro development tasksets y un ejemplo Stage 1 de retrieval determinista.

## Stage 1

`nova-stage1-paraguay-retrieval-001` obtuvo 5/5 en un slice factual de cinco ítems, con 0 errores, 0 llamadas externas LLM/API y 0 training compute. Solo respalda la decisión estrecha de no entrenar para ese gap; no mide conocimiento paraguayo general, Guaraní/Jopara, generalización ni superioridad.

Artifact SHA-256: `4ffddc7fa09c5092258a632f79fb051e3b82ddbd142fad1383578a9c8491858d`.

## Verificación

El grafo npm de v0.1.0 está congelado en `package-lock.json`. Usá Node 22 y una instalación limpia:

```bash
npm ci
npm run typecheck
npm test
npm run verify:release
```

Dependency lock SHA-256: `572ad3d67ffec0fe1caa8234e73f421a013bc3da383fe6bd621e94a2d846688d`.

Canonical: https://www.novalabs.com.py/investigacion/benchmark

Para crítica o replicación, usá los issue templates públicos con versión, protocolo y evidencia. Citación machine-readable: `CITATION.cff`. No hay DOI para v0.1.0.
