import { parseEvalTask, type EvalTask } from '../py-aieval';

type DevelopmentTaskSet={
  id:string;
  version:string;
  status:'development';
  rankable:false;
  limitations:string[];
  tasks:EvalTask[];
};

type ExactTaskInput={
  id:string;
  prompt:string;
  accepted:string[];
  source:string;
  reference:string;
};

const RETRIEVED_AT='2026-09-09';

function sourcedExactTask(input:ExactTaskInput){
  return parseEvalTask({
    id:input.id,
    version:'0.1.0',
    domain:'paraguayan-spanish',
    language:'es-PY',
    prompt:input.prompt,
    weight:1,
    scorer:{kind:'exact_match',accepted:input.accepted,caseSensitive:false},
    provenance:{
      kind:'public_source',
      source:input.source,
      reference:input.reference,
      retrievedAt:RETRIEVED_AT,
      reviewed:true,
    },
  });
}

const DPD_VOS='https://www.rae.es/dpd/vos';
const RAE_CONJUGATION='https://www.rae.es/buen-uso-espa%C3%B1ol/conjugaci%C3%B3n-espa%C3%B1ola';
const RAE_TREATMENT='https://www.rae.es/gram%C3%A1tica/sintaxis/las-formas-de-tratamiento-ii-sustantivos-y-grupos-nominales';

export const paraguayanSpanishDevV01:DevelopmentTaskSet={
  id:'py-aieval-paraguayan-spanish-dev-v0.1',
  version:'0.1.0',
  status:'development',
  rankable:false,
  limitations:[
    'Este development slice no representa la diversidad completa del español paraguayo ni permite inferir competencia lingüística general.',
    'Los ítems cubren únicamente rasgos explícitamente documentados en las fuentes citadas y favorecen respuestas determinísticas de formato corto.',
    'Todavía requiere revisión lingüística adicional y validación con hablantes nativos antes de cualquier consideración como benchmark estable.',
    'El conjunto es visible en el repositorio y no debe tratarse como holdout privado ni utilizarse para afirmar superioridad entre modelos.',
    'Guaraní y jopara quedan fuera de este slice establemente delimitado hasta contar con revisión lingüística específica.',
  ],
  tasks:[
    sourcedExactTask({
      id:'py.es-py.voseo-pronoun-001.v1',
      prompt:'Según el Diccionario panhispánico de dudas de la RAE/ASALE, ¿qué pronombre de segunda persona singular se usa en Paraguay para el tratamiento informal? Respondé únicamente con el pronombre.',
      accepted:['vos'],
      source:'RAE/ASALE — Diccionario panhispánico de dudas: vos',
      reference:DPD_VOS,
    }),
    sourcedExactTask({
      id:'py.es-py.voseo-amar-001.v1',
      prompt:'La tabla de conjugación de la RAE/ASALE registra dos formas para la segunda persona singular del presente de indicativo de “amar”: “amas / ___”. Completá únicamente la forma voseante.',
      accepted:['amás'],
      source:'RAE/ASALE — El buen uso del español: conjugación española',
      reference:RAE_CONJUGATION,
    }),
    sourcedExactTask({
      id:'py.es-py.voseo-temer-001.v1',
      prompt:'La tabla de conjugación de la RAE/ASALE registra dos formas para la segunda persona singular del presente de indicativo de “temer”: “temes / ___”. Completá únicamente la forma voseante.',
      accepted:['temés'],
      source:'RAE/ASALE — El buen uso del español: conjugación española',
      reference:RAE_CONJUGATION,
    }),
    sourcedExactTask({
      id:'py.es-py.voseo-tener-001.v1',
      prompt:'La tabla de conjugación de la RAE/ASALE registra para “tener” las formas “tienes / ___” en segunda persona singular del presente de indicativo. Completá únicamente la forma voseante.',
      accepted:['tenés'],
      source:'RAE/ASALE — El buen uso del español: conjugación española',
      reference:RAE_CONJUGATION,
    }),
    sourcedExactTask({
      id:'py.es-py.voseo-venir-001.v1',
      prompt:'La tabla de conjugación de la RAE/ASALE registra para “venir” las formas “vienes / ___” en segunda persona singular del presente de indicativo. Completá únicamente la forma voseante.',
      accepted:['venís'],
      source:'RAE/ASALE — El buen uso del español: conjugación española',
      reference:RAE_CONJUGATION,
    }),
    sourcedExactTask({
      id:'py.es-py.treatment-na-001.v1',
      prompt:'La Nueva gramática de la lengua española señala que en Paraguay es frecuente una aféresis de “doña”. ¿Cuál es esa forma? Respondé únicamente con la forma registrada.',
      accepted:['ña'],
      source:'RAE/ASALE — Nueva gramática de la lengua española: formas de tratamiento',
      reference:RAE_TREATMENT,
    }),
    sourcedExactTask({
      id:'py.es-py.colloquial-bolu-001.v1',
      prompt:'La Nueva gramática de la lengua española registra en Paraguay una contracción coloquial de “boludo”. ¿Cuál es? Respondé únicamente con la forma registrada.',
      accepted:['bolú'],
      source:'RAE/ASALE — Nueva gramática de la lengua española: formas de tratamiento',
      reference:RAE_TREATMENT,
    }),
  ],
};
