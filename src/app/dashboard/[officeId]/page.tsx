import Link from 'next/link';
import { ArrowLeft, Users, PlusCircle, Trash2, Edit } from 'lucide-react';
import { getEmployees, getOfficeBySlug, getOffices, Office, Employee } from '@/lib/data';
import DashboardPageClient from '@/components/DashboardPageClient';
import OfficeSummaryDashboard from '@/components/OfficeSummaryDashboard';
import { Button } from '@/components/ui/button';
import BulkUpdateNamesModal from '@/components/BulkUpdateNamesModal';

type DashboardPageWrapperProps = {
  params: {
    officeId: string;
  };
};

export default async function DashboardPageWrapper({ params }: DashboardPageWrapperProps) {
  const { officeId } = params;

  if (officeId === 'general') {
    const offices = await getOffices();
    const allEmployees = await getEmployees();
    const office = { name: 'Panel General', id: 'general' };

    const officeHeader = (
      <div className="flex items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-card-foreground">
          Panel de Asistencia - {office.name}
        </h1>
      </div>
    );
    
    return (
      <DashboardPageClient
        officeId={officeId}
        office={office}
        initialEmployees={[]}
        allEmployees={allEmployees}
        offices={offices}
        officeHeader={officeHeader}
        isGeneralPanel={true}
      />
    );
  }

  const office = await getOfficeBySlug(officeId);
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

  const [initialEmployees, offices] = await Promise.all([
    getEmployees(officeId),
    getOffices()
  ]);

  const officeHeader = (
    <div className="flex items-center gap-4">
       <Link href="/">
          <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4"/>
          </Button>
       </Link>
      <h1 className="text-xl md:text-2xl font-bold text-card-foreground">
        {office.name}
      </h1>
    </div>
  );

  return (
     <DashboardPageClient
        officeId={officeId}
        office={office}
        initialEmployees={initialEmployees}
        allEmployees={[]}
        offices={offices}
        officeHeader={officeHeader}
        isGeneralPanel={false}
      />
  )
}
