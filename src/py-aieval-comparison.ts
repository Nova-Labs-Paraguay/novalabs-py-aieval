import { verifyEvalReport, type EvalReport } from './py-aieval-report';

export type ComparabilityReason=
  | 'insufficient_runs'
  | 'invalid_report'
  | 'duplicate_run'
  | 'protocol_mismatch';

export type ComparabilityAssessment={
  comparable:boolean;
  reasons:ComparabilityReason[];
  protocolSha256:string|null;
  runIds:string[];
};

function blocked(reason:ComparabilityReason,runIds:string[]=[]):ComparabilityAssessment{
  return {comparable:false,reasons:[reason],protocolSha256:null,runIds};
}

export function assessComparableReports(inputs:unknown[]):ComparabilityAssessment{
  if(inputs.length<2)return blocked('insufficient_runs');

  const reports:EvalReport[]=[];
  for(const input of inputs){
    if(!verifyEvalReport(input))return blocked('invalid_report');
    reports.push(input);
  }

  const runIds=reports.map(report=>report.run.runId);
  if(new Set(runIds).size!==runIds.length)return blocked('duplicate_run',runIds);

  const protocolFingerprints=new Set(reports.map(report=>report.protocolSha256));
  if(protocolFingerprints.size!==1)return blocked('protocol_mismatch',runIds);

  return {
    comparable:true,
    reasons:[],
    protocolSha256:reports[0].protocolSha256,
    runIds,
  };
}
