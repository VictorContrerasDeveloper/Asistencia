import DashboardPageClient from '@/components/DashboardPageClient';

export default async function GeneralDashboardPage() {
  const generalOffice = {
    id: 'general',
    name: 'General',
    employees: []
  };

  // The actual data fetching will now happen inside DashboardPageClient on the client-side
  return (
    <DashboardPageClient
      office={generalOffice}
    />
  );
}
