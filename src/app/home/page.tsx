import type { Metadata } from 'next';
import { HomeDashboard } from '@/components/home-profile/home-dashboard';

export const metadata: Metadata = {
  title: 'My Home',
  description: 'Manage your household air quality profile, indoor plants, and home readiness score.',
};

export default function HomePage() {
  return <HomeDashboard />;
}

