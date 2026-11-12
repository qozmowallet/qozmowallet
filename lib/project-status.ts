export const QOZMO_REPOSITORY='https://github.com/imrybrndo/qozmo-wallet';
export const QOZMO_REPOSITORY_API='https://api.github.com/repos/imrybrndo/qozmo-wallet';
export const CORE_REFERENCE={
  transactionHash:'0xc24e471f61c604bf48032ff734a2c967f0c8ec14dd0be675eec12339e818a376',
  account:'0xdb09E41fC28EDD6f2dC38C00D6A9340625Ce4A3B',
  label:'WOTS core reference · 19 October 2026',
  attribution:'This transaction predates the Qozmo integration. It is a reference run of the integrated WOTS core, not a transaction claimed to have been created through Qozmo.',
} as const;
export const MAINNET_GATES=[
  {title:'Reproducible Qozmo testnet evidence',description:'Publish successful Qozmo-run operations, exact source revisions, review cases and reproducible verification.'},
  {title:'Public source and independent review',description:'Make reviewed source available; publish an independent security review and address its findings.'},
  {title:'Stateful-key and recovery review',description:'Resolve release policy for key exposure, rollback, loss of the original device, and backup limitations.'},
  {title:'Reviewed deployment and operations',description:'Publish chain-specific contract pins, infrastructure validation, monitoring and a reviewed rollout plan.'},
] as const;
export type PublicRepositoryStatus={status:'public'|'unavailable'|'unknown';checkedAt:string;message:string;commit?:string};
/** Uses GitHub's anonymous API; no token, local credential, or repository visibility mutation. */
export async function checkPublicRepository(fetcher:typeof fetch=fetch,signal?:AbortSignal):Promise<PublicRepositoryStatus>{
  const checkedAt=new Date().toISOString();
  try{
    const response=await fetcher(QOZMO_REPOSITORY_API,{headers:{Accept:'application/vnd.github+json'},credentials:'omit',signal:AbortSignal.any([...(signal?[signal]:[]),AbortSignal.timeout(12_000)])});
    if(response.status===404)return {status:'unavailable',checkedAt,message:'GitHub did not expose this repository to an anonymous request. It may be private, unavailable, or configured under another URL.'};
    if(!response.ok)return {status:'unknown',checkedAt,message:'GitHub access could not be checked. A rate limit or service error is not evidence of a private repository.'};
    const repo=await response.json();
    if(repo.private!==false||repo.visibility!=='public'||repo.full_name?.toLowerCase()!=='imrybrndo/qozmo-wallet'||repo.html_url!==QOZMO_REPOSITORY)return {status:'unavailable',checkedAt,message:'The response did not establish public access to the configured Qozmo repository.'};
    return {status:'public',checkedAt,message:'The configured repository is accessible through GitHub’s anonymous API.'};
  }catch{signal?.throwIfAborted();return {status:'unknown',checkedAt,message:'GitHub access could not be checked. Retry shortly.'};}
}
