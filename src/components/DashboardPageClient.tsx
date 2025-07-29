
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, PlusCircle, Trash2, Users, Layers, ChevronDown, UserPlus } from 'lucide-react';
import { Office, Employee, getEmployees, getOffices } from '@/lib/data';
import { Button } from '@/components/ui/button';
import AddEmployeeModal from './AddEmployeeModal';
import TheoreticalStaffingTable from './TheoreticalStaffingTable';
import DraggableStaffDashboard from './DraggableStaffDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


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
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [employees, setEmployees] = useState(allEmployeesProp);
  const [offices, setOffices] = useState<Office[]>(officesProp);

  const refetchAllData = async () => {
     const [allEmployeesData, allOfficesData] = await Promise.all([
       getEmployees(),
       getOffices(),
     ]);
     setEmployees(allEmployeesData);
     setOffices(allOfficesData);
  }

  const officeHeader = (
     <div className="flex items-center justify-center">
      <h1 className="text-xl md:text-2xl font-bold text-card-foreground">
        Panel de Asistencia - {office.name}
      </h1>
    </div>
  )

  const handleEmployeeUpdated = (updatedEmployee: Employee) => {
    setEmployees(prev => {
        const newEmployees = prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e);
        // Also refetch offices in case employee was moved to a new office that wasn't rendered
        if(updatedEmployee.officeId !== employees.find(e => e.id === updatedEmployee.id)?.officeId) {
            refetchAllData();
        }
        return newEmployees;
    });
  }

  return (
    <>
    <div className="flex flex-col h-screen bg-background text-foreground">
       <main className="flex-1 overflow-auto p-4 md:p-8">
          <>
             <header className="flex flex-col items-center justify-center p-4 border-b bg-card mb-8 gap-4">
               {officeHeader}
               <div className="flex items-center gap-2 flex-wrap justify-center">
                  <Link href="/">
                    <Button variant="outline">
                      <ArrowLeft />
                      Volver a Paneles
                    </Button>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary">
                        <Layers />
                        Gestión de Personal
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                       <DropdownMenuItem onClick={() => setAddModalOpen(true)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>Agregar Personal</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/bulk-update-levels">
                          <Layers className="mr-2 h-4 w-4" />
                          <span>Gestión Masiva de Datos</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                         <Link href="/dashboard/bulk-add-employees">
                          <Users className="mr-2 h-4 w-4" />
                          <span>Carga Masiva de Personal</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/delete-employee">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Eliminar Personal</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

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
    <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={refetchAllData}
    />
    </>
  );
}
