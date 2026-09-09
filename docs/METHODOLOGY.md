# Methodology

PY-AIEval separates task definitions, provider execution, stored outputs, deterministic scoring and publication gates. Each run records benchmark version/slice hash, provider/model identity, generation configuration and only a hash of the system prompt. Offline rescoring uses stored outputs. Comparisons require the same protocol fingerprint. v0.1 public tasksets are development-only and non-rankable.
