
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Users, PlusCircle, Trash2, Edit } from 'lucide-react';
import { getEmployees, getOfficeBySlug, getOffices, slugify, Office, Employee } from '@/lib/data';
import DashboardClient from '@/components/DashboardClient';
import OfficeSummaryDashboard from '@/components/OfficeSummaryDashboard';
import OfficeAttendanceSummary from '@/components/OfficeAttendanceSummary';
import { Button } from '@/components/ui/button';
import BulkUpdateNamesModal from '@/components/BulkUpdateNamesModal';

type DashboardPageProps = {
  params: {
    officeId: string;
  };
};

// This page now needs to be a client component to handle modal state
export default function DashboardPageWrapper({ params }: DashboardPageProps) {
  // We will fetch data in a client component and pass it down.
  // This is a common pattern for pages that need both server-side data fetching
  // and client-side interactivity.
  return <DashboardPage params={params} />;
}


function DashboardPage({ params }: DashboardPageProps) {
  const [offices, setOffices] = useState<Office[]>([]);
  const [office, setOffice] = useState<Office | {name: string, id: string} | null>(null);
  const [initialEmployees, setInitialEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { officeId } = params;
      setLoading(true);
      const officesData = await getOffices();
      setOffices(officesData);
      
      const officeData = officeId === 'general' ? { name: 'Panel General', id: 'general' } : await getOfficeBySlug(officeId);
      setOffice(officeData);

      if (officeId === 'general') {
        const allEmployeesData = await getEmployees();
        setAllEmployees(allEmployeesData);
        setInitialEmployees([]);
      } else {
        const initialEmployeesData = await getEmployees(officeId);
        setInitialEmployees(initialEmployeesData);
        setAllEmployees([]);
      }
      setLoading(false);
    }
    fetchData();
  }, [params]);

  const refetchAllEmployees = async () => {
     const allEmployeesData = await getEmployees();
     setAllEmployees(allEmployeesData);
  }

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Cargando...</h1>
        </div>
    );
  }

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

  const isGeneralPanel = params.officeId === 'general';

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
        {params.officeId === 'general' ? (
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
                   <Button variant="secondary" onClick={() => setUpdateModalOpen(true)}>
                      <Edit />
                      Actualizar Nombres
                  </Button>
                  <Link href="/dashboard/delete-employee">
                      <Button variant="destructive">
                          <Trash2 />
                          Eliminar Personal
                      </Button>
                  </Link>
               </div>
            </header>
            <OfficeSummaryDashboard offices={offices} employees={allEmployees} />
            <BulkUpdateNamesModal 
              isOpen={isUpdateModalOpen}
              onClose={() => setUpdateModalOpen(false)}
              onSuccess={refetchAllEmployees}
            />
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
