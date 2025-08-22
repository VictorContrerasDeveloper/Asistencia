
"use client";

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Download, Save, Eraser, PlusCircle, Pencil, LogOut } from 'lucide-react';
import { Office, Employee, getEmployees, getOffices, DailySummary, getDailySummaries, saveDailySummary, deleteDailySummary, clearAllRealStaffing, EmployeeRole, AttendanceStatus, updateEmployee } from '@/lib/data';
import { Button } from '@/components/ui/button';
import AddEmployeeModal from './AddEmployeeModal';
import DraggableStaffDashboard from './DraggableStaffDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from 'date-fns';
import Papa from 'papaparse';
import ManualEntryTable from './ManualEntryTable';
import ProlongedAbsenceTable from './ProlongedAbsenceTable';
import DailySummaryTable from './DailySummaryTable';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AddAbsenceModal from './AddAbsenceModal';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import EditTheoreticalStaffingModal from './EditTheoreticalStaffingModal';
import SaveDayModal from './SaveDayModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useAuth } from '@/hooks/useAuth';

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
  const { logout } = useAuth();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditStaffingModalOpen, setIsEditStaffingModalOpen] = useState(false);
  const [employees, setEmployees] = useState(allEmployeesProp);
  const [offices, setOffices] = useState<Office[]>(officesProp);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('staffing');


  // Manual Entry States
  const { toast } = useToast();
  const [isSavingDay, setIsSavingDay] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isSaveDayModalOpen, setIsSaveDayModalOpen] = useState(false);
  const manualEntryTableRef = React.useRef<{ getSummaryData: () => any }>(null);
  const [summaryToDelete, setSummaryToDelete] = useState<string | null>(null);
  const [isClearAlertOpen, setClearAlertOpen] = useState(false);
  

  const refetchData = async () => {
     setLoading(true);
     const [allEmployeesData, allOfficesData, fetchedSummaries] = await Promise.all([
       getEmployees(),
       getOffices(),
       getDailySummaries(),
     ]);
     setEmployees(allEmployeesData);
     setOffices(allOfficesData);
     setDailySummaries(fetchedSummaries);
     setLoading(false);
  }

  useEffect(() => {
    setEmployees(allEmployeesProp);
    setOffices(officesProp);
  }, [allEmployeesProp, officesProp]);

  useEffect(() => {
    const fetchSummaries = async () => {
        setLoading(true);
        const fetchedSummaries = await getDailySummaries();
        setDailySummaries(fetchedSummaries);
        setLoading(false);
    }
    fetchSummaries();
  }, [])

  const handleExport = () => {
    const officeMap = new Map(offices.map(o => [o.id, o.name]));
    const dataToExport = employees
    .filter(emp => emp.workMode === 'Operaciones')
    .map(emp => ({
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

  const handleEmployeeUpdated = (updatedEmployee: Employee) => {
    setEmployees(prev => {
        const index = prev.findIndex(e => e.id === updatedEmployee.id);
        if(index !== -1) {
            const newEmployees = [...prev];
            newEmployees[index] = updatedEmployee;
            return newEmployees;
        }
        // If employee was deleted, filter them out.
        return prev.filter(e => e.id !== updatedEmployee.id);
    });
  }

  // Manual Entry functions
  const handleAbsenceUpdated = (updatedEmployee: Employee) => {
    setEmployees(prev => {
      const index = prev.findIndex(e => e.id === updatedEmployee.id);
      if (index !== -1) {
        const newEmployees = [...prev];
        newEmployees[index] = updatedEmployee;
        return newEmployees;
      }
      return prev;
    });
  }

  const handleEmployeeReinstated = (reinstatedEmployeeId: string) => {
     setEmployees(prev => 
      prev.map(emp => emp.id === reinstatedEmployeeId ? { ...emp, status: 'Presente', absenceReason: null, absenceEndDate: undefined } : emp)
    );
  }

  const handleAbsenceAdded = (newOrUpdatedEmployee: Employee) => {
    setEmployees(prev => {
      const index = prev.findIndex(e => e.id === newOrUpdatedEmployee.id);
      if (index !== -1) {
        const newEmployees = [...prev];
        newEmployees[index] = newOrUpdatedEmployee;
        return newEmployees;
      }
      return [...prev, newOrUpdatedEmployee];
    });
    setIsAbsenceModalOpen(false);
  }
  
  const handleConfirmSaveDay = async (date: Date) => {
    setIsSavingDay(true);
    if(manualEntryTableRef.current) {
      try {
        const summaryData = manualEntryTableRef.current.getSummaryData();
        await saveDailySummary(date, summaryData);
        const fetchedSummaries = await getDailySummaries();
        setDailySummaries(fetchedSummaries);
        toast({
          title: "Reporte Guardado",
          description: `El resumen del día ${format(date, 'PPP')} ha sido guardado.`,
        });
      } catch (error) {
         toast({
          title: "Error",
          description: "No se pudo guardar el resumen del día.",
          variant: "destructive"
        });
      } finally {
        setIsSavingDay(false);
        setIsSaveDayModalOpen(false);
      }
    } else {
       setIsSavingDay(false);
    }
  };

  const handleDeleteSummary = async () => {
    if (!summaryToDelete) return;

    try {
      await deleteDailySummary(summaryToDelete);
      setDailySummaries(prev => prev.filter(s => s.id !== summaryToDelete));
    } catch (error) {
       toast({
        title: "Error",
        description: "No se pudo eliminar el resumen.",
        variant: "destructive"
      });
    } finally {
      setSummaryToDelete(null);
    }
  };

  const handleClearRealStaffing = async () => {
    try {
        const officeIds = offices.map(o => o.id);
        await clearAllRealStaffing(officeIds);
        
        const clearedOffices = offices.map(office => ({
            ...office,
            realStaffing: {
                Modulo: 0,
                Anfitrión: 0,
                Tablet: 0,
                Supervisión: 0,
            }
        }));
        setOffices(clearedOffices);

    } catch (error) {
         toast({
            title: "Error",
            description: "No se pudo limpiar la dotación en la base de datos.",
            variant: "destructive",
        });
    } finally {
        setClearAlertOpen(false);
    }
  };

  const handleStaffingUpdate = (officeId: string, role: EmployeeRole, value: number) => {
    setOffices(prevOffices => {
      return prevOffices.map(o => {
        if (o.id === officeId) {
          const newRealStaffing = { ...o.realStaffing, [role]: value };
          return { ...o, realStaffing: newRealStaffing };
        }
        return o;
      });
    });
  };

   const handleAttendanceChange = async (employeeId: string, newStatus: AttendanceStatus) => {
    const originalEmployees = [...employees];
    
    // Optimistic update
    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId) {
        const updates: Partial<Employee> = { status: newStatus };
        if (newStatus === 'Presente' || newStatus === 'Atrasado') {
          updates.absenceReason = null;
        } else if (newStatus === 'Ausente') {
          updates.absenceReason = 'Inasistencia';
        }
        return { ...emp, ...updates };
      }
      return emp;
    });
    setEmployees(updatedEmployees);

    try {
        const updates: Partial<Employee> = { status: newStatus };
         if (newStatus === 'Presente' || newStatus === 'Atrasado') {
          updates.absenceReason = null;
        } else {
          updates.absenceReason = 'Inasistencia';
        }
        await updateEmployee(employeeId, updates);
    } catch (error) {
        // Revert on failure
        setEmployees(originalEmployees);
        toast({
            title: "Error",
            description: "No se pudo actualizar el estado del empleado.",
            variant: "destructive"
        });
    }
  };


  const officeHeader = (
     <div className="flex items-center justify-center">
      <h1 className="text-xl md:text-2xl font-bold text-card-foreground">
        Panel de Asistencia - {office.name}
      </h1>
    </div>
  )

  const manualOffices = offices.filter(office => !office.name.toLowerCase().includes('movil'));


  return (
    <TooltipProvider>
    <div className="flex flex-col h-screen bg-background text-foreground">
       <main className="flex-1 overflow-auto p-4 md:p-8">
          <>
             <header className="flex flex-col md:flex-row items-center justify-between p-4 border-b bg-card mb-8 gap-4">
               <div className="flex items-center gap-2 flex-wrap justify-center">
                  <Button variant="secondary" onClick={() => setAddModalOpen(true)}>
                      <UserPlus />
                      <span>Agregar Personal</span>
                  </Button>
               </div>
               <div className="flex items-center gap-2">
                  {activeTab === 'staffing' && (
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={handleExport}>
                                <Download />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Exportar a CSV</p>
                        </TooltipContent>
                    </Tooltip>
                  )}
                   <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="destructive" size="icon" onClick={logout}>
                              <LogOut />
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Cerrar Sesión</p>
                        </TooltipContent>
                    </Tooltip>
               </div>
            </header>
            
            <Tabs defaultValue="staffing" className="w-full" onValueChange={setActiveTab} value={activeTab}>
                <TabsList className='mb-0 grid w-full grid-cols-3 bg-transparent p-0 border-b border-destructive rounded-none'>
                  <TabsTrigger value="staffing" className="data-[state=active]:border-b-4 data-[state=active]:border-destructive data-[state=active]:-mb-px data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-muted-foreground data-[state=active]:bg-background data-[state=active]:shadow-none rounded-none">Dotación Asignada</TabsTrigger>
                  <TabsTrigger value="report" className="data-[state=active]:border-b-4 data-[state=active]:border-destructive data-[state=active]:-mb-px data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-muted-foreground data-[state=active]:bg-background data-[state=active]:shadow-none rounded-none">Reporte Diario</TabsTrigger>
                  <TabsTrigger value="absences" className="data-[state=active]:border-b-4 data-[state=active]:border-destructive data-[state=active]:-mb-px data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-muted-foreground data-[state=active]:bg-background data-[state=active]:shadow-none rounded-none">Ausencias Prolongadas</TabsTrigger>
                </TabsList>
              <TabsContent value="staffing" className="mt-6">
                <DraggableStaffDashboard 
                  offices={offices} 
                  employees={employees} 
                  onEmployeeUpdate={handleEmployeeUpdated}
                />
              </TabsContent>
              <TabsContent value="report" className="space-y-8 mt-6">
                  <Card id="manual-entry-summary" className="w-full overflow-hidden">
                    <div className="border-b">
                      <CardHeader className="flex flex-row items-center justify-center p-4">
                        <CardTitle className="underline">Resumen dotacion Of. Com. Helpbank</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4">
                        {loading ? (
                          <div className="space-y-2 p-6">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ) : (
                          <ManualEntryTable 
                            ref={manualEntryTableRef} 
                            offices={manualOffices} 
                            employees={employees} 
                            onStaffingUpdate={handleStaffingUpdate}
                            onAttendanceChange={handleAttendanceChange}
                          />
                        )}
                      </CardContent>
                    </div>
                    <CardFooter className="flex justify-end items-center p-2 exclude-from-image bg-card">
                        <TooltipProvider>
                          <div className="flex items-center gap-2">
                               <Tooltip>
                                <TooltipTrigger asChild>
                                   <Button size="icon" variant="ghost" onClick={() => setIsEditStaffingModalOpen(true)}>
                                      <Pencil className="h-5 w-5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar Dotación Teórica</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => setIsSaveDayModalOpen(true)} disabled={isSavingDay}>
                                    <Save className="h-5 w-5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Guardar Día</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => setClearAlertOpen(true)}>
                                    <Eraser className="h-5 w-5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Limpiar Ingresos</p>
                                </TooltipContent>
                              </Tooltip>
                          </div>
                        </TooltipProvider>
                    </CardFooter>
                  </Card>

                  <Card id="daily-summary" className="w-full overflow-hidden">
                    <CardHeader className="items-center">
                      <CardTitle>Resumen Diario Guardado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <Skeleton className="h-40 w-full" />
                      ) : (
                        <DailySummaryTable summaries={dailySummaries} onDelete={setSummaryToDelete} />
                      )}
                    </CardContent>
                  </Card>
              </TabsContent>
              <TabsContent value="absences" className="space-y-8 mt-6">
                 <Card id="prolonged-absence-summary" className="w-full overflow-hidden">
                    <div className="border-b">
                        <CardHeader className="flex flex-row items-center justify-center p-4 text-center">
                            <CardTitle className="w-full">Ausencias Prolongadas</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4">
                            {loading ? (
                            <div className="p-6">
                                <Skeleton className="h-40 w-full" />
                            </div>
                            ) : (
                                <ProlongedAbsenceTable 
                                    offices={manualOffices} 
                                    employees={employees}
                                    onEmployeeReinstated={handleEmployeeReinstated}
                                    onAbsenceUpdated={handleAbsenceUpdated}
                                />
                            )}
                        </CardContent>
                    </div>
                    <CardFooter className="flex justify-end p-2 exclude-from-image bg-card gap-2">
                        <Button size="icon" variant="ghost" onClick={() => setIsAbsenceModalOpen(true)} title="Agregar Ausencia">
                            <PlusCircle className="h-5 w-5" />
                        </Button>
                    </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </>
      </main>
    </div>
    <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={refetchData}
    />
     <AddAbsenceModal 
        isOpen={isAbsenceModalOpen}
        onClose={() => setIsAbsenceModalOpen(false)}
        onAbsenceAdded={handleAbsenceAdded}
        allEmployees={employees}
    />
     <EditTheoreticalStaffingModal
        isOpen={isEditStaffingModalOpen}
        onClose={() => setIsEditStaffingModalOpen(false)}
        onSuccess={refetchData}
        offices={offices}
      />
    <SaveDayModal
        isOpen={isSaveDayModalOpen}
        onClose={() => setIsSaveDayModalOpen(false)}
        onSave={handleConfirmSaveDay}
        isSaving={isSavingDay}
     />
     <AlertDialog open={!!summaryToDelete} onOpenChange={(isOpen) => !isOpen && setSummaryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este resumen?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el registro del día.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSummaryToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSummary}>
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isClearAlertOpen} onOpenChange={setClearAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de limpiar los ingresos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción borrará todos los números de dotación real que has ingresado en la tabla. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearRealStaffing}>
              Sí, limpiar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
