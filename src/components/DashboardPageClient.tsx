
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Edit, PlusCircle, Trash2, Users, Layers } from 'lucide-react';
import { Office, Employee, getEmployees } from '@/lib/data';
import { Button } from '@/components/ui/button';
import BulkUpdateNamesModal from '@/components/BulkUpdateNamesModal';
import AddEmployeeModal from './AddEmployeeModal';
import TheoreticalStaffingTable from './TheoreticalStaffingTable';
import DraggableStaffDashboard from './DraggableStaffDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


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
  const [offices, setOffices] = useState<Office[]>(officesProp);

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

  const handleEmployeeUpdated = (updatedEmployee: Employee) => {
    setEmployees(prev => prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
  }

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
                  <Link href="/dashboard/bulk-update-levels">
                    <Button variant="secondary">
                        <Layers />
                        Gestión Masiva
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
            
            <Tabs defaultValue="staffing" className="w-full">
              <TabsList className='mb-4'>
                <TabsTrigger value="staffing">Dotación Asignada</TabsTrigger>
                <TabsTrigger value="theoretical">Dotación Teórica</TabsTrigger>
              </TabsList>
              <TabsContent value="staffing">
                <DraggableStaffDashboard 
                  offices={offices} 
                  employees={employees} 
                  onEmployeeUpdate={handleEmployeeUpdated}
                />
              </TabsContent>
              <TabsContent value="theoretical">
                 <TheoreticalStaffingTable offices={offices} roles={['Modulo', 'Tablet', 'Anfitrión', 'Supervisión']} />
              </TabsContent>
            </Tabs>
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
