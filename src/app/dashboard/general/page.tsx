import { getOffices, getEmployees } from '@/lib/data';
import DashboardPageClient from '@/components/DashboardPageClient';

export const revalidate = 0;

export default async function GeneralDashboardPage() {
  const allEmployees = await getEmployees();
  const offices = await getOffices();
  
  const generalOffice = {
    id: 'general',
    name: 'General'
  };

  return (
    <DashboardPageClient 
      office={generalOffice} 
      allEmployees={allEmployees}
      offices={offices}
    />
  );
}
