
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, PlusCircle, Trash2, Users, Layers, ChevronDown, UserPlus, Download, RefreshCw } from 'lucide-react';
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
import { format } from 'date-fns';
import Papa from 'papaparse';


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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refetchAllData = async () => {
     const [allEmployeesData, allOfficesData] = await Promise.all([
       getEmployees(),
       getOffices(),
     ]);
     setEmployees(allEmployeesData);
     setOffices(allOfficesData);
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchAllData();
    setIsRefreshing(false);
  }

  const handleExport = () => {
    const officeMap = new Map(offices.map(o => [o.id, o.name]));
    const dataToExport = employees.map(emp => ({
      'Nombre': emp.name,
      'Oficina': officeMap.get(emp.officeId) || 'Sin Asignar',
      'Rol': emp.role,
      'Nivel': emp.level || 'Nivel Básico',
      'Estado': emp.status,
    }));

    const csv = Papa.unparse(dataToExport, { delimiter: ';' });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const formattedDate = format(new Date(), 'dd-MM-yyyy_HH-mm');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte-asistencia_${formattedDate}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar a CSV
                  </Button>
                  <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refrescando...' : 'Refrescar'}
                  </Button>
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
                  onRefreshData={refetchAllData}
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
