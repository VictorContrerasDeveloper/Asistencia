
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Users, PlusCircle, Trash2, Edit } from 'lucide-react';
import { Office, Employee, getEmployees } from '@/lib/data';
import DashboardClient from '@/components/DashboardClient';
import OfficeSummaryDashboard from '@/components/OfficeSummaryDashboard';
import { Button } from '@/components/ui/button';
import BulkUpdateNamesModal from '@/components/BulkUpdateNamesModal';

type DashboardPageClientProps = {
  officeId: string;
  office: Office | { name: string; id: string; };
  initialEmployees: Employee[];
  allEmployees: Employee[];
  offices: Office[];
  officeHeader: React.ReactNode;
  isGeneralPanel: boolean;
};

export default function DashboardPageClient({ 
    officeId, 
    office, 
    initialEmployees: initialEmployeesProp, 
    allEmployees: allEmployeesProp, 
    offices: officesProp,
    officeHeader,
    isGeneralPanel 
}: DashboardPageClientProps) {
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [allEmployees, setAllEmployees] = useState<Employee[]>(allEmployeesProp);
  const [offices, setOffices] = useState<Office[]>(officesProp);

  const refetchAllEmployees = async () => {
     const allEmployeesData = await getEmployees();
     setAllEmployees(allEmployeesData);
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
       <main className="flex-1 overflow-auto p-4 md:p-8">
        {isGeneralPanel ? (
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
            initialEmployees={initialEmployeesProp} 
            offices={officesProp} 
            office={office as Office}
            officeHeader={officeHeader} 
          />
        )}
      </main>
    </div>
  );
}
