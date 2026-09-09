import { parseEvalTask, type EvalTask } from '../py-aieval';

export type DevelopmentTaskSet={
  id:string;
  version:string;
  status:'development';
  rankable:false;
  limitations:string[];
  tasks:EvalTask[];
};

const original=(id:string,prompt:string,scorer:Parameters<typeof parseEvalTask>[0])=>
  parseEvalTask({
    id,
    version:'0.1.0',
    domain:'reasoning',
    language:'es-PY',
    prompt,
    weight:1,
    scorer,
    provenance:{source:'nova-original-2026-09-09',reviewed:true},
  });

export const reasoningDevV01:DevelopmentTaskSet={
  id:'py-aieval-reasoning-dev-v0.1',
  version:'0.1.0',
  status:'development',
  rankable:false,
  limitations:[
    'Development-only slice for validating the evaluation harness; it is not a public leaderboard set.',
    'Items are small deterministic checks and do not establish broad reasoning capability.',
    'The slice is visible in source and must not be treated as a private holdout.',
  ],
  tasks:[
    original(
      'py.reasoning.arithmetic-001.v1',
      'Calculá 137 + 286. Respondé únicamente con el número.',
      {kind:'numeric',expected:423,tolerance:0},
    ),
    original(
      'py.reasoning.arithmetic-002.v1',
      'Calculá 84 × 17. Respondé únicamente con el número.',
      {kind:'numeric',expected:1428,tolerance:0},
    ),
    original(
      'py.reasoning.arithmetic-003.v1',
      'Calculá 960 ÷ 24. Respondé únicamente con el número.',
      {kind:'numeric',expected:40,tolerance:0},
    ),
    original(
      'py.reasoning.percent-001.v1',
      '¿Cuánto es el 15% de 240? Respondé únicamente con el número.',
      {kind:'numeric',expected:36,tolerance:0},
    ),
    original(
      'py.reasoning.algebra-001.v1',
      'Resolvé 3x + 7 = 28. Respondé únicamente con el valor de x.',
      {kind:'numeric',expected:7,tolerance:0},
    ),
    original(
      'py.reasoning.average-001.v1',
      'Calculá el promedio aritmético de 12, 18, 25 y 5. Respondé únicamente con el número.',
      {kind:'numeric',expected:15,tolerance:0},
    ),
    original(
      'py.reasoning.fraction-001.v1',
      'Calculá 3/4 + 5/8 y expresá el resultado como número decimal. Respondé únicamente con el número.',
      {kind:'numeric',expected:1.375,tolerance:0},
    ),
    original(
      'py.reasoning.sequence-001.v1',
      'La secuencia es 2, 6, 12, 20, 30. Si el término n sigue la regla n(n+1), ¿cuál es el siguiente término? Respondé únicamente con el número.',
      {kind:'numeric',expected:42,tolerance:0},
    ),
    original(
      'py.reasoning.logic-001.v1',
      'Hay tres cajas A, B y C y exactamente una contiene una ficha. Se sabe que A está vacía y C está vacía. ¿Qué caja contiene la ficha? Respondé solo A, B o C.',
      {kind:'exact_match',accepted:['B'],caseSensitive:false},
    ),
    original(
      'py.reasoning.logic-002.v1',
      'Premisas: ningún elemento del conjunto A pertenece al conjunto B. El elemento X pertenece al conjunto A. ¿Puede concluirse que X pertenece al conjunto B? Respondé únicamente Sí o No.',
      {kind:'exact_match',accepted:['No'],caseSensitive:false},
    ),
  ],
};
