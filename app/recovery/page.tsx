import type { Metadata } from 'next';
import RecoveryWorkbench from '@/components/recovery-workbench';
import '../dashboard/dashboard.css';
import '../dashboard/tools.css';

export const metadata: Metadata = { title:'Qozmo — Offline recovery research',description:'Independent offline recovery research artifacts. No onchain activation.',robots:{index:false,follow:false} };
export default function RecoveryPage() { return <RecoveryWorkbench/>; }
