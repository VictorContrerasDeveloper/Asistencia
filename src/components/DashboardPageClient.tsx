
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Edit, PlusCircle, Trash2, Users } from 'lucide-react';
import { Office, Employee, getEmployees } from '@/lib/data';
import OfficeSummaryDashboard from '@/components/OfficeSummaryDashboard';
import { Button } from '@/components/ui/button';
import BulkUpdateNamesModal from '@/components/BulkUpdateNamesModal';
import AddEmployeeModal from './AddEmployeeModal';

type DashboardPageClientProps = {
  office: { name: string; id: string; };
  allEmployees: Employee[];
  offices: Office[];
};

export default function DashboardPageClient({ 
    office, 
    allEmployees: allEmployeesProp, 
    offices: officesProp,
}: DashboardPageClientProps) {
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [employees, setEmployees] = useState(allEmployeesProp);
  const [offices] = useState<Office[]>(officesProp);

  const refetchAllData = async () => {
     const [allEmployeesData] = await Promise.all([
       getEmployees(),
     ]);
     setEmployees(allEmployeesData);
  }

  const officeHeader = (
     <div className="flex items-center gap-4">
      <h1 className="text-xl md:text-2xl font-bold text-card-foreground">
        Panel de Asistencia - {office.name}
      </h1>
    </div>
  )

  return (
    <>
    <div className="flex flex-col h-screen bg-background text-foreground">
       <main className="flex-1 overflow-auto p-4 md:p-8">
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
                  <Button onClick={() => setAddModalOpen(true)}>
                      <PlusCircle />
                      Agregar Personal
                  </Button>
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
            <OfficeSummaryDashboard offices={offices} employees={employees} />
          </>
      </main>
    </div>
    <BulkUpdateNamesModal 
      isOpen={isUpdateModalOpen}
      onClose={() => setUpdateModalOpen(false)}
      onSuccess={refetchAllData}
    />
    <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={refetchAllData}
    />
    </>
  );
}
