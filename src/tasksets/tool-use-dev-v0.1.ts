import { parseEvalTask, type EvalTask } from '../py-aieval';

type DevelopmentTaskSet={
  id:string;
  version:string;
  status:'development';
  rankable:false;
  limitations:string[];
  tasks:EvalTask[];
};

type ToolCallExpectation={
  tool:string;
  arguments:Record<string,unknown>;
};

function toolTask(
  id:string,
  request:string,
  tools:string[],
  expectation:ToolCallExpectation,
){
  const toolList=tools.map(tool=>`- ${tool}`).join('\n');
  return parseEvalTask({
    id,
    version:'0.1.0',
    domain:'tool-use',
    language:'es-PY',
    prompt:[
      request,
      '',
      'Herramientas disponibles:',
      toolList,
      '',
      'Respondé únicamente con JSON válido en este formato exacto:',
      '{"tool":"<nombre>","arguments":{...},"completion_state":"tool_call"}',
      'No agregues explicación, Markdown ni campos fuera de tool, arguments y completion_state.',
    ].join('\n'),
    weight:1,
    scorer:{
      kind:'tool_call',
      tool:expectation.tool,
      arguments:expectation.arguments,
      completionState:'tool_call',
    },
    provenance:{
      kind:'original',
      source:'nova-original-tool-use-2026-09-09',
      reviewed:true,
    },
  });
}

export const toolUseDevV01:DevelopmentTaskSet={
  id:'py-aieval-tool-use-dev-v0.1',
  version:'0.1.0',
  status:'development',
  rankable:false,
  limitations:[
    'Development-only slice authored by Nova Labs Research; it has not passed independent benchmark review or contamination release gates.',
    'The tasks score structured tool selection and argument construction only; they do not execute tools or verify real-world side effects.',
    'This slice does not measure multi-turn recovery, confirmation flows, permission handling or execution-state reconciliation.',
    'Tool names and schemas are synthetic provider-neutral contracts defined inside each prompt and must not be interpreted as support for a specific vendor API.',
  ],
  tasks:[
    toolTask(
      'py.tool.calendar-slots-001.v1',
      'Necesitás buscar espacios libres de 30 minutos para el 10 de septiembre de 2026. No crees ningún evento todavía.',
      [
        'calendar.find_free_slots arguments: {"date": string, "duration_minutes": number}',
        'calendar.create_event arguments: {"title": string, "start": string, "duration_minutes": number}',
      ],
      {tool:'calendar.find_free_slots',arguments:{date:'2026-09-10',duration_minutes:30}},
    ),
    toolTask(
      'py.tool.contact-search-001.v1',
      'Buscá el contacto guardado llamado “Ana López”. No envíes ningún mensaje.',
      [
        'contacts.search arguments: {"query": string}',
        'messaging.send arguments: {"recipient": string, "message": string}',
      ],
      {tool:'contacts.search',arguments:{query:'Ana López'}},
    ),
    toolTask(
      'py.tool.docs-search-001.v1',
      'Necesitás localizar documentación interna sobre la política de reembolsos. Todavía no resumas ni respondas la política.',
      [
        'docs.search arguments: {"query": string, "limit": number}',
        'docs.summarize arguments: {"document_id": string}',
      ],
      {tool:'docs.search',arguments:{query:'política de reembolsos',limit:5}},
    ),
    toolTask(
      'py.tool.support-ticket-001.v1',
      'Creá un ticket de soporte con prioridad alta para el asunto “Pago duplicado” y la descripción “El cliente reporta dos cargos por la misma compra”.',
      [
        'support.create_ticket arguments: {"subject": string, "description": string, "priority": "low"|"medium"|"high"}',
        'support.search_tickets arguments: {"query": string}',
      ],
      {
        tool:'support.create_ticket',
        arguments:{
          subject:'Pago duplicado',
          description:'El cliente reporta dos cargos por la misma compra',
          priority:'high',
        },
      },
    ),
    toolTask(
      'py.tool.calculator-001.v1',
      'Usá la calculadora disponible para evaluar exactamente la expresión “240 * 0.15”. No hagas el cálculo mentalmente en la respuesta.',
      [
        'calculator.evaluate arguments: {"expression": string}',
        'web.search arguments: {"query": string}',
      ],
      {tool:'calculator.evaluate',arguments:{expression:'240 * 0.15'}},
    ),
    toolTask(
      'py.tool.inventory-001.v1',
      'Consultá el inventario del SKU “NOVA-042” en el depósito “ASU-01”. No reserves ni modifiques stock.',
      [
        'inventory.lookup arguments: {"sku": string, "warehouse": string}',
        'inventory.reserve arguments: {"sku": string, "warehouse": string, "quantity": number}',
      ],
      {tool:'inventory.lookup',arguments:{sku:'NOVA-042',warehouse:'ASU-01'}},
    ),
    toolTask(
      'py.tool.crm-company-001.v1',
      'Buscá en el CRM la empresa llamada “Acme Paraguay”. No actualices ningún registro.',
      [
        'crm.search_company arguments: {"name": string}',
        'crm.update_company arguments: {"company_id": string, "fields": object}',
      ],
      {tool:'crm.search_company',arguments:{name:'Acme Paraguay'}},
    ),
    toolTask(
      'py.tool.files-search-001.v1',
      'Localizá archivos cuyo contenido trate sobre “arquitectura de agentes”. Limitá la búsqueda a 10 resultados.',
      [
        'files.search arguments: {"query": string, "limit": number}',
        'files.delete arguments: {"file_id": string}',
      ],
      {tool:'files.search',arguments:{query:'arquitectura de agentes',limit:10}},
    ),
  ],
};
