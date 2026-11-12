import type { Metadata } from 'next';
import { QozmoDashboard } from '@/components/dashboard/qozmo-dashboard';
import './dashboard.css';
import './quantum.css';
import './tools.css';
import './privacy.css';

export const metadata: Metadata = {
  title: 'Qozmo — Your DeFi workspace',
  description: 'One Qozmo smart account for your wallet, Quantum security and Privacy Ring on Robinhood Testnet, alongside live markets.',
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <QozmoDashboard />;
}
