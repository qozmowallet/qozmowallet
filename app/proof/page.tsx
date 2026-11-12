import type {Metadata} from 'next';
import {CORE_REFERENCE} from '@/lib/project-status';
import {ProofCenter} from '@/components/proof-center';
import referenceProof from '@/public/evidence/wots-core-reference.json';
import type {WotsProof} from '@/lib/wallet/wots-proof';
import './proof.css';
export const metadata:Metadata={title:'Qozmo — Proof & project status',description:'Recheck public WOTS transaction evidence, repository availability, mainnet release criteria and the current token integration status.'};
export default function ProofPage(){if(referenceProof.status!=='verified'||referenceProof.transactionHash!==CORE_REFERENCE.transactionHash)throw new Error('Reference evidence must pass verification before publication.');return <ProofCenter referenceProof={referenceProof as WotsProof}/>;}
