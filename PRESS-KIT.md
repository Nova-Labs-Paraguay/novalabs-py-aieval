# PY-AIEval v0.1 — Press Kit factual

**Estado:** preparado para publicación técnica. No distribuir antes de que exista y se verifique el repositorio público `Nova-Labs-Paraguay/nova-py-aieval` con release inmutable `v0.1.0`.

## Titular recomendado

**Nova Labs publica PY-AIEval v0.1, una metodología y harness abierto para evaluación reproducible de IA en contexto paraguayo.**

## Resumen

PY-AIEval v0.1 es un paquete técnico de Nova Labs Research orientado a hacer reproducibles evaluaciones de sistemas de IA relacionadas con Paraguay. La versión incluye un schema de tareas, scorers deterministas, un runner neutral a proveedor, manifests, hashes de protocolo y artefacto, controles de contaminación/comparabilidad, adapters para OpenAI Responses y Hugging Face Chat, cuatro tasksets públicos de desarrollo y un ejemplo reproducible de system baseline.

Los tasksets públicos de v0.1 están marcados explícitamente como `rankable: false`. Esta versión no publica un leaderboard ni sostiene que un modelo sea superior a otro.

## Cinco hechos verificables

1. **Cuatro development tasksets públicos:** razonamiento, conocimiento factual de Paraguay, español paraguayo y tool use estructurado. Todos son `rankable: false`.
2. **Dos adapters bajo un contrato común:** OpenAI Responses y Hugging Face Chat.
3. **Artefactos verificables:** cada corrida puede conservar configuración, outputs, scores, operaciones y hashes para auditoría y rescoring offline.
4. **Stage 1 reproducible:** el baseline determinista de retrieval `nova-stage1-paraguay-retrieval-001` obtuvo 5/5 sobre un slice factual de cinco ítems, con 0 errores, 0 llamadas externas LLM/API y 0 compute de entrenamiento.
5. **Decisión de ingeniería documentada:** ese resultado solo respalda no entrenar/fine-tunear un modelo para ese gap factual estrecho; no respalda una conclusión general sobre conocimiento paraguayo.

## Artefactos de referencia

- Canonical humano: `https://www.novalabs.com.py/investigacion/benchmark`
- Repositorio previsto: `https://github.com/Nova-Labs-Paraguay/nova-py-aieval`
- Release previsto: `v0.1.0`
- Stage 1 artifact SHA-256: `4ffddc7fa09c5092258a632f79fb051e3b82ddbd142fad1383578a9c8491858d`
- Inventory SHA-256 staged: `503a415a2558a70fc853cfe500235e19962ad2cca7778a33d77d260ff64c2502`

Los links al repositorio/release deben usarse públicamente solo después de que existan y hayan sido verificados.

## Qué demuestra

- Que Nova Labs tiene un harness técnico reproducible para desarrollar y auditar evaluaciones.
- Que los development sets actuales pueden ejecutarse bajo contratos explícitos y conservar evidencia técnica.
- Que un baseline de retrieval simple resolvió el pequeño slice factual Stage 1 bajo el criterio predeclarado, por lo que no se justificó gastar compute en entrenamiento para ese caso concreto.

## Qué NO demuestra

- No demuestra que PY-AIEval sea el primer, mejor, mayor o único benchmark paraguayo.
- No demuestra superioridad de Nova, de un modelo ni de un proveedor.
- No demuestra cobertura representativa del español paraguayo.
- No demuestra competencia general en Guaraní o Jopara.
- No demuestra conocimiento paraguayo general: el Stage 1 tiene cinco ítems factuales de desarrollo.
- No constituye un leaderboard público.
- No implica que Nova haya entrenado un modelo propio en esta release.

## Metodología en una frase

`task definition → provider/system execution → stored outputs → deterministic scoring → artifact/protocol hashes → contamination/comparability/release gates`.

## Preguntas frecuentes

**¿Es un benchmark final?**  
No. v0.1 publica metodología, harness y tasksets de desarrollo no rankeables. Los dominios estables y cualquier leaderboard futuro requieren gates adicionales.

**¿Nova entrenó un modelo para este release?**  
No. El Stage 1 documentó que un baseline de retrieval era suficiente para el gap factual evaluado y registró una decisión explícita de no escalar compute.

**¿Por qué publicar un resultado 5/5 si solo son cinco preguntas?**  
Porque el resultado no se presenta como benchmark de modelos. Es una prueba reproducible del flujo end-to-end y de una decisión de ingeniería estrecha. La limitación de cinco ítems forma parte central del release.

**¿Se puede criticar o replicar?**  
Sí. El repositorio público incluye templates para bugs, fallos de reproducibilidad y críticas/replicaciones metodológicas con versión, protocolo y evidencia.

## Cita sugerida

> Nova Labs Research. *PY-AIEval v0.1*. 2026. Canonical: https://www.novalabs.com.py/investigacion/benchmark

La metadata machine-readable se publica en `CITATION.cff`.

## Contacto

Usar los canales públicos oficiales de Nova Labs asociados al canonical de Research. No atribuir partnerships, endorsements o revisiones externas sin permiso explícito.
