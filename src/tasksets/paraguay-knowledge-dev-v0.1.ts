import { parseEvalTask, type EvalTask } from '../py-aieval';

type DevelopmentTaskSet={
  id:string;
  version:string;
  status:'development';
  rankable:false;
  limitations:string[];
  tasks:EvalTask[];
};

const countryProfile='https://www2.mre.gov.py/embapar-francia/index.php/el-paraguay/perfil-pais';
const independenceProfile='https://www.mre.gov.py/embapar-qatar/index.php/es/el-paraguay/perfil-pais';

function sourcedTask(
  id:string,
  prompt:string,
  scorer:EvalTask['scorer'],
  reference:string,
){
  return parseEvalTask({
    id,
    version:'0.1.0',
    domain:'paraguay-knowledge',
    language:'es-PY',
    prompt,
    weight:1,
    scorer,
    provenance:{
      kind:'public_source',
      source:'Ministerio de Relaciones Exteriores de la República del Paraguay',
      reference,
      retrievedAt:'2026-09-09',
      reviewed:true,
    },
  });
}

export const paraguayKnowledgeDevV01:DevelopmentTaskSet={
  id:'py-aieval-paraguay-knowledge-dev-v0.1',
  version:'0.1.0',
  status:'development',
  rankable:false,
  limitations:[
    'Development-only sourced slice; it has not passed contamination review or independent factual review for leaderboard use.',
    'The items intentionally prioritize evergreen facts and do not measure current-officeholder or population knowledge.',
    'Public source pages can change; retrieval date and source URL are part of each task provenance.',
  ],
  tasks:[
    sourcedTask(
      'py.knowledge.capital-001.v1',
      '¿Cuál es la capital de la República del Paraguay? Respondé únicamente con el nombre de la ciudad.',
      {kind:'exact_match',accepted:['Asunción','Asuncion'],caseSensitive:false},
      countryProfile,
    ),
    sourcedTask(
      'py.knowledge.languages-001.v1',
      '¿Cuáles son los dos idiomas oficiales del Paraguay? Respondé únicamente con ambos idiomas.',
      {
        kind:'exact_match',
        accepted:['Castellano y guaraní','Guaraní y castellano','Español y guaraní','Guaraní y español'],
        caseSensitive:false,
      },
      countryProfile,
    ),
    sourcedTask(
      'py.knowledge.currency-001.v1',
      '¿Cuál es la moneda del Paraguay? Respondé únicamente con el nombre de la moneda.',
      {kind:'exact_match',accepted:['Guaraní','Guarani'],caseSensitive:false},
      countryProfile,
    ),
    sourcedTask(
      'py.knowledge.departments-001.v1',
      '¿En cuántos departamentos está dividido administrativamente Paraguay, sin contar el distrito capital? Respondé únicamente con el número.',
      {kind:'numeric',expected:17,tolerance:0},
      countryProfile,
    ),
    sourcedTask(
      'py.knowledge.independence-001.v1',
      'Según la ficha oficial del Paraguay, ¿qué fechas corresponden a la Independencia del país? Respondé en el formato “14 y 15 de mayo de 1811”.',
      {kind:'exact_match',accepted:['14 y 15 de mayo de 1811'],caseSensitive:false},
      independenceProfile,
    ),
  ],
};
