# Stage 1 — Paraguay factual retrieval baseline 001

**Status:** Internal development experiment  
**Run ID:** `nova-stage1-paraguay-retrieval-001`  
**Artifact:** `stage1-paraguay-retrieval-001.json`  
**Artifact SHA-256:** `4ffddc7fa09c5092258a632f79fb051e3b82ddbd142fad1383578a9c8491858d`

## Research question

Can a deterministic local retrieval system backed by official Paraguayan sources solve the current factual Paraguay Knowledge development slice well enough that model training is not justified for this narrow gap?

## Hypothesis

For the five evergreen factual items currently present in the Paraguay Knowledge development slice, explicit retrieval should be sufficient and additional model training should not be necessary.

## Success criterion fixed before the final run

- score: **5/5** on `py-aieval-paraguay-knowledge-dev-v0.1`;
- provider errors: **0**;
- model-training compute: **0**.

If all three conditions are met, Nova does not allocate model-training compute to this specific factual gap. Failure would justify testing a richer grounded system before considering fine-tuning or pretraining.

## Observed result

- score: **5/5 (1.0)**;
- provider errors: **0**;
- all five outputs: `retrieval_hit`;
- model-training compute: **0**;
- external LLM/API calls: **0**.

The first implementation exposed a real retrieval-ranking collision: the departments question also mentioned the word “capital”, causing an incorrect capital lookup and a 4/5 score. A regression test reproduced that failure. The retriever was then changed to use the earliest matched subject as the deterministic tie-breaker, after which the frozen run reached 5/5.

## Decision

**Do not train or fine-tune a model to solve this current five-item factual Paraguay slice.** The simpler system baseline already satisfies the pre-declared criterion.

This decision is deliberately narrow. It does **not** say that retrieval solves Paraguayan knowledge in general, that Nova has a better model, or that model research is unnecessary for other gaps.

## What the experiment establishes

It establishes that the current development slice is too small and too fact-retrieval-oriented to justify custom model training. It also validates the end-to-end path from a system baseline through PY-AIEval scoring to a tamper-evident persisted artifact.

## Limitations

- The evaluation contains only five evergreen factual tasks.
- The task set is development-only and explicitly non-rankable.
- The retrieval knowledge base contains the facts needed for the evaluated questions; this is intentional for a grounded-system baseline and is not a test of memorized model knowledge.
- Several sources come from the same public institution used in benchmark provenance, so the result is not evidence of source-independent generalization.
- The experiment does not evaluate broad Paraguayan culture, current events, nuanced language, Guaraní/Jopara competence, reasoning over long documents, or open-ended factuality.
- Latency is represented as zero because the provider is an in-process deterministic lookup; this should not be compared to networked model latency.
- No public model-quality or superiority claim is supported by this run.

## Next research implication

Before spending compute on a custom model, Nova should create a harder, independently reviewed Paraguay-context gap that cannot be solved by direct deterministic lookup. The next candidate should compare a base model, grounded retrieval, and a structured/tool-augmented system under one frozen evaluation protocol. Only a residual measured gap should advance to fine-tuning or continued pretraining.
