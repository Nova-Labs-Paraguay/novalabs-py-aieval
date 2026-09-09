import { z } from 'zod';
import type { EvalRunArtifact } from './py-aieval-artifact';
import { verifyContaminationAudit } from './py-aieval-contamination';

const semver=/^\d+\.\d+\.\d+$/;
const sha256=/^[a-f0-9]{64}$/;

const benchmarkReleaseSchema=z.object({
  releaseId:z.string().min(3).regex(/^[a-z0-9._-]+$/),
  status:z.enum(['draft','candidate','final','retired']),
  artifactSha256:z.string().regex(sha256),
  benchmarkVersion:z.string().regex(semver),
  benchmarkSliceHash:z.string().regex(sha256),
  methodologyVersion:z.string().regex(semver),
  evaluatorVersion:z.string().regex(semver),
  contaminationStatus:z.enum(['checked_clear','not_checked','known_overlap']),
  contaminationAuditSha256:z.string().regex(sha256).nullable(),
  protocolConsistency:z.enum(['same_protocol','mixed_protocol']),
  reviewedBy:z.string().min(2),
  reviewedAt:z.string().datetime(),
  limitations:z.array(z.string().min(3)),
}).strict();

export type BenchmarkRelease=z.infer<typeof benchmarkReleaseSchema>;

export function parseBenchmarkRelease(input:unknown):BenchmarkRelease{
  return benchmarkReleaseSchema.parse(input);
}

export function assessBenchmarkRelease(
  release:BenchmarkRelease,
  artifact:EvalRunArtifact,
  contaminationAudit?:unknown,
){
  const reasons:string[]=[];

  if(release.status!=='final')reasons.push('release_not_final');
  if(release.artifactSha256!==artifact.artifactSha256)reasons.push('artifact_checksum_mismatch');
  if(release.benchmarkVersion!==artifact.manifest.benchmarkVersion)reasons.push('benchmark_version_mismatch');
  if(release.benchmarkSliceHash!==artifact.manifest.benchmarkSliceHash)reasons.push('benchmark_slice_mismatch');

  if(release.contaminationStatus!=='checked_clear'){
    reasons.push('contamination_not_clear');
  }

  if(release.contaminationStatus==='checked_clear'){
    if(release.contaminationAuditSha256===null||contaminationAudit===undefined){
      reasons.push('contamination_evidence_missing');
    }else if(!verifyContaminationAudit(contaminationAudit)){
      reasons.push('contamination_audit_invalid');
    }else{
      if(release.contaminationAuditSha256!==contaminationAudit.auditSha256){
        reasons.push('contamination_audit_checksum_mismatch');
      }
      if(
        release.benchmarkVersion!==contaminationAudit.benchmarkVersion||
        artifact.manifest.benchmarkVersion!==contaminationAudit.benchmarkVersion
      ){
        reasons.push('contamination_audit_benchmark_mismatch');
      }
      if(
        release.benchmarkSliceHash!==contaminationAudit.benchmarkSliceHash||
        artifact.manifest.benchmarkSliceHash!==contaminationAudit.benchmarkSliceHash
      ){
        reasons.push('contamination_audit_slice_mismatch');
      }
      if(contaminationAudit.status!=='checked_clear'){
        reasons.push('contamination_not_clear');
      }
    }
  }else if(contaminationAudit!==undefined){
    if(!verifyContaminationAudit(contaminationAudit)){
      reasons.push('contamination_audit_invalid');
    }else{
      if(release.contaminationAuditSha256!==null&&release.contaminationAuditSha256!==contaminationAudit.auditSha256){
        reasons.push('contamination_audit_checksum_mismatch');
      }
      if(
        release.benchmarkVersion!==contaminationAudit.benchmarkVersion||
        artifact.manifest.benchmarkVersion!==contaminationAudit.benchmarkVersion
      ){
        reasons.push('contamination_audit_benchmark_mismatch');
      }
      if(
        release.benchmarkSliceHash!==contaminationAudit.benchmarkSliceHash||
        artifact.manifest.benchmarkSliceHash!==contaminationAudit.benchmarkSliceHash
      ){
        reasons.push('contamination_audit_slice_mismatch');
      }
    }
  }

  if(release.protocolConsistency!=='same_protocol')reasons.push('protocol_not_consistent');
  if(release.limitations.length===0)reasons.push('limitations_missing');

  return {publishable:reasons.length===0,reasons:[...new Set(reasons)]};
}
