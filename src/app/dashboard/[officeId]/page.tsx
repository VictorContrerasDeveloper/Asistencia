
import Link from 'next/link';
import { ArrowLeft, FileText, Users, PlusCircle, Trash2, Edit } from 'lucide-react';
import { getEmployees, getOfficeBySlug, getOffices, slugify, Office, Employee } from '@/lib/data';
import DashboardClient from '@/components/DashboardClient';
import OfficeSummaryDashboard from '@/components/OfficeSummaryDashboard';
import OfficeAttendanceSummary from '@/components/OfficeAttendanceSummary';
import { Button } from '@/components/ui/button';

type DashboardPageProps = {
  params: {
    officeId: string;
  };
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { officeId } = params;
  const offices = await getOffices();
  const office = officeId === 'general' ? { name: 'Panel General', id: 'general' } : await getOfficeBySlug(officeId);
  const initialEmployees = await getEmployees(officeId);

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

  const allEmployees = officeId === 'general' ? await getEmployees() : [];
  const isGeneralPanel = officeId === 'general';

  const officeHeader = (
    <div className="flex items-center gap-4">
      {!isGeneralPanel && (
           <Link href="/">
              <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4"/>
              </Button>
           </Link>
      )}
      <h1 className="text-xl md:text-2xl font-bold text-card-foreground">
        {isGeneralPanel ? `Panel de Asistencia - ${office.name}` : office.name}
      </h1>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
       <main className="flex-1 overflow-auto p-4 md:p-8">
        {officeId === 'general' ? (
          <>
             <header className="flex items-center p-4 border-b bg-card justify-center flex-col md:flex-row md:justify-between mb-8">
               {officeHeader}
               <div className="flex items-center gap-2 mt-4 md:mt-0 flex-wrap justify-center">
                  <Link href="/">
                    <Button variant="outline">
                      <ArrowLeft />
                      Volver a Paneles
                    </Button>
                  </Link>
                  <Link href="/dashboard/add-employee">
                    <Button>
                        <PlusCircle />
                        Agregar Personal
                    </Button>
                  </Link>
                  <Link href="/dashboard/bulk-add-employees">
                      <Button>
                          <Users />
                          Carga Masiva
                      </Button>
                  </Link>
                  <Link href="/dashboard/delete-employee">
                      <Button variant="destructive">
                          <Trash2 />
                          Eliminar Personal
                      </Button>
                  </Link>
               </div>
            </header>
            <OfficeSummaryDashboard offices={offices} employees={allEmployees} />
          </>
        ) : (
          <DashboardClient 
            initialEmployees={initialEmployees} 
            offices={offices} 
            office={office as Office}
            officeHeader={officeHeader} 
          />
        )}
      </main>
    </div>
  );
}
