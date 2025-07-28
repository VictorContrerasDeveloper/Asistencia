
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getEmployees, getOfficeBySlug, getOffices, Office, Employee } from '@/lib/data';
import DashboardPageClient from '@/components/DashboardPageClient';
import { Button } from '@/components/ui/button';

type DashboardPageWrapperProps = {
  params: {
    officeId: string;
  };
};

export default async function DashboardPageWrapper({ params }: DashboardPageWrapperProps) {
  const { officeId } = params;

  if (officeId === 'general') {
    const [offices, allEmployees] = await Promise.all([
        getOffices(),
        getEmployees()
    ]);
    const office = { name: 'Panel General', id: 'general' };

    return (
      <DashboardPageClient
        officeId={officeId}
        office={office}
        initialEmployees={[]}
        allEmployees={allEmployees}
        offices={offices}
        isGeneralPanel={true}
      />
    );
  }

  const offices = await getOffices();
  const office = await getOfficeBySlug(officeId, offices);
  
  if (!office) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Oficina no encontrada</h1>
        <Link href="/">
          <Button>Volver a la selección</Button>
        </Link>
      </div>
    );
  }

  const initialEmployees = await getEmployees(office.id);

  return (
     <DashboardPageClient
        officeId={officeId}
        office={office}
        initialEmployees={initialEmployees}
        allEmployees={[]}
        offices={offices}
        isGeneralPanel={false}
      />
  )
}

    