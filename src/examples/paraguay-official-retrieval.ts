import type { EvalProvider, EvalProviderRequest, EvalProviderResult } from '../py-aieval';

type KnowledgeEntry={
  id:string;
  hints:string[];
  answer:string;
  source:{publisher:string;reference:string;retrievedAt:string};
};

type KnowledgeBase={
  id:string;
  version:'0.1.0';
  status:'development';
  limitations:string[];
  entries:KnowledgeEntry[];
};

const publisher='Ministerio de Relaciones Exteriores de la República del Paraguay';
const retrievedAt='2026-09-09';

export const paraguayOfficialKnowledgeV01:KnowledgeBase={
  id:'paraguay-official-knowledge-v0.1',
  version:'0.1.0',
  status:'development',
  limitations:[
    'Development-only deterministic retrieval baseline; it is not a language model and is not leaderboard-eligible.',
    'The knowledge base contains a small set of evergreen facts selected to test whether retrieval can close the factual Paraguay gap before model training is justified.',
    'Some facts are sourced from the same public institution used by the development benchmark, so this run measures grounded retrieval capability rather than independent memorized knowledge.',
  ],
  entries:[
    {
      id:'capital',
      hints:['capital','ciudad capital'],
      answer:'Asunción',
      source:{publisher,reference:'https://www2.mre.gov.py/la/index.php/el-paraguay/perfil-pais',retrievedAt},
    },
    {
      id:'official-languages',
      hints:['idioma oficial','idiomas oficiales','lengua oficial','lenguas oficiales'],
      answer:'Castellano y guaraní',
      source:{publisher,reference:'https://www.mre.gov.py/unidad-de-asuntos-linguisticos/',retrievedAt},
    },
    {
      id:'currency',
      hints:['moneda','signo monetario'],
      answer:'Guaraní',
      source:{publisher,reference:'https://www2.mre.gov.py/usa/index.php/el-paraguay/perfil-pais',retrievedAt},
    },
    {
      id:'departments',
      hints:['departamento','departamentos','division administrativa','división administrativa'],
      answer:'17',
      source:{publisher,reference:'https://www.mre.gov.py/embapar-qatar/index.php/es/el-paraguay/perfil-pais',retrievedAt},
    },
    {
      id:'independence',
      hints:['independencia','fecha de independencia','fechas de independencia'],
      answer:'14 y 15 de mayo de 1811',
      source:{publisher,reference:'https://www2.mre.gov.py/la/index.php/el-paraguay/perfil-pais',retrievedAt},
    },
  ],
};

function normalize(value:string){
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLocaleLowerCase('es-PY')
    .replace(/[^a-z0-9ñ]+/g,' ')
    .trim()
    .replace(/\s+/g,' ');
}

function retrieve(prompt:string){
  const query=` ${normalize(prompt)} `;
  let best:{entry:KnowledgeEntry;score:number;firstMatchIndex:number}|null=null;
  for(const entry of paraguayOfficialKnowledgeV01.entries){
    let score=0;
    let firstMatchIndex=Number.POSITIVE_INFINITY;
    for(const hint of entry.hints){
      const normalizedHint=normalize(hint);
      const matchIndex=query.indexOf(` ${normalizedHint} `);
      if(matchIndex<0)continue;
      score+=normalizedHint.split(' ').length;
      firstMatchIndex=Math.min(firstMatchIndex,matchIndex);
    }
    const beatsBest=score>0&&(
      !best||
      score>best.score||
      (score===best.score&&firstMatchIndex<best.firstMatchIndex)
    );
    if(beatsBest)best={entry,score,firstMatchIndex};
  }
  return best?.entry??null;
}

export function createParaguayOfficialRetrievalProvider():EvalProvider{
  return {
    providerId:'nova-local-retrieval',
    modelId:'paraguay-official-knowledge-v0.1',
    modelRevision:'0.1.0',
    async generate(request:EvalProviderRequest):Promise<EvalProviderResult>{
      const entry=retrieve(request.prompt);
      if(!entry){
        return {
          text:'',
          finishReason:'retrieval_abstain',
          latencyMs:0,
          providerMetadata:{knowledgeBaseVersion:paraguayOfficialKnowledgeV01.version,retrievalStatus:'abstain'},
        };
      }
      return {
        text:entry.answer,
        finishReason:'retrieval_hit',
        latencyMs:0,
        providerMetadata:{
          knowledgeBaseVersion:paraguayOfficialKnowledgeV01.version,
          retrievalStatus:'hit',
          entryId:entry.id,
          sourceReference:entry.source.reference,
        },
      };
    },
  };
}
