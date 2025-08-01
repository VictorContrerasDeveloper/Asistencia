
"use client";

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Layers, ChevronDown, UserPlus, Download, Camera, Save, CalendarIcon, Eraser, PlusCircle, Pencil } from 'lucide-react';
import { Office, Employee, getEmployees, getOffices, DailySummary, getDailySummaries, saveDailySummary, deleteDailySummary, clearAllRealStaffing } from '@/lib/data';
import { Button } from '@/components/ui/button';
import AddEmployeeModal from './AddEmployeeModal';
import DraggableStaffDashboard from './DraggableStaffDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from 'date-fns';
import Papa from 'papaparse';
import ManualEntryTable from '@/components/ManualEntryTable';
import ProlongedAbsenceTable from '@/components/ProlongedAbsenceTable';
import DailySummaryTable from '@/components/DailySummaryTable';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AddAbsenceModal from '@/components/AddAbsenceModal';
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import html2canvas from 'html2canvas';
import EditTheoreticalStaffingModal from './EditTheoreticalStaffingModal';

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
  const [isEditStaffingModalOpen, setIsEditStaffingModalOpen] = useState(false);
  const [employees, setEmployees] = useState(allEmployeesProp);
  const [offices, setOffices] = useState<Office[]>(officesProp);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Entry States
  const { toast } = useToast();
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingAbsence, setIsGeneratingAbsence] = useState(false);
  const [isSavingDay, setIsSavingDay] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const manualEntryTableRef = React.useRef<{ getSummaryData: () => any }>(null);
  const [summaryToDelete, setSummaryToDelete] = useState<string | null>(null);
  const [isClearAlertOpen, setClearAlertOpen] = useState(false);
  

  const refetchAllData = async () => {
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
    refetchAllData();
  }, [])

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

  const handleEmployeeUpdated = (updatedEmployee: Employee) => {
    setEmployees(prev => {
        const newEmployees = prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e);
        if(updatedEmployee.officeId !== employees.find(e => e.id === updatedEmployee.id)?.officeId) {
            refetchAllData();
        }
        return newEmployees;
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

  const copyCanvasToClipboard = async (canvas: HTMLCanvasElement) => {
     canvas.toBlob(async (blob) => {
        if(blob) {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
            } catch (err) {
                 console.error("Failed to copy image to clipboard", err);
            }
        }
      }, 'image/png');
  }

  const handleGenerateSummaryImage = async () => {
    setIsGeneratingSummary(true);
    const summaryTable = document.getElementById('manual-entry-summary');
    if (!summaryTable) {
        setIsGeneratingSummary(false);
        return;
    }

    const inputs = summaryTable.querySelectorAll('input[type="number"]');
    const originalValues: { el: HTMLElement, originalContent: string, originalPadding: string }[] = [];

    const elementsToHide = summaryTable.querySelectorAll('.exclude-from-image');
    elementsToHide.forEach(el => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.display = 'none';
    });
    
    inputs.forEach((input) => {
      const inputEl = input as HTMLInputElement;
      const cell = inputEl.parentElement as HTMLTableCellElement;
      
      if (cell) {
        originalValues.push({ el: cell, originalContent: cell.innerHTML, originalPadding: cell.style.padding });

        const value = inputEl.value || '0';
        const isDeficit = inputEl.className.includes('bg-red-600');
        
        const centeredContent = `
          <div class="w-full h-7 flex items-center justify-center rounded-md ${isDeficit ? 'bg-red-600 text-white' : ''}">
            ${value}
          </div>
        `;

        cell.innerHTML = centeredContent;
        cell.style.padding = '0';
      }
    });

    const officeCells = summaryTable.querySelectorAll('td.font-medium');
     officeCells.forEach(cell => {
        const htmlCell = cell as HTMLElement;
        originalValues.push({ el: htmlCell, originalContent: htmlCell.innerHTML, originalPadding: htmlCell.style.padding });
        htmlCell.style.padding = '0.25rem'; 
     });


    try {
      const canvas = await html2canvas(summaryTable, { scale: 2, backgroundColor: null });
      await copyCanvasToClipboard(canvas);
    } catch (error) {
       console.error("Error generating summary image:", error);
    } finally {
        originalValues.forEach(item => {
          item.el.innerHTML = item.originalContent;
          item.el.style.padding = item.originalPadding;
        });
        elementsToHide.forEach(el => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.display = '';
        });
        setIsGeneratingSummary(false);
    }
  };


  const handleGenerateAbsenceImage = async () => {
    setIsGeneratingAbsence(true);
    const absenceTable = document.getElementById('prolonged-absence-summary');
     if (!absenceTable) {
        setIsGeneratingAbsence(false);
        return;
    }
    
    const elementsToHide = absenceTable.querySelectorAll('.exclude-from-image');
    const originalDisplays: { el: HTMLElement, display: string}[] = [];
    
    elementsToHide.forEach(el => {
        const htmlEl = el as HTMLElement;
        originalDisplays.push({el: htmlEl, display: htmlEl.style.display });
        htmlEl.style.display = 'none';
    });

    try {
      const canvas = await html2canvas(absenceTable, { scale: 2, backgroundColor: null });
      await copyCanvasToClipboard(canvas);
    } catch (error) {
       console.error("Error generating absence image:", error);
    } finally {
        originalDisplays.forEach(item => item.el.style.display = item.display);
        setIsGeneratingAbsence(false);
    }
  };
  
  const handleSaveDay = async () => {
    if (!selectedDate) return;
    setIsSavingDay(true);
    if(manualEntryTableRef.current) {
      try {
        const summaryData = manualEntryTableRef.current.getSummaryData();
        await saveDailySummary(selectedDate, summaryData);
        const fetchedSummaries = await getDailySummaries();
        setDailySummaries(fetchedSummaries);
      } catch (error) {
         toast({
          title: "Error",
          description: "No se pudo guardar el resumen del día.",
          variant: "destructive"
        });
      } finally {
        setIsSavingDay(false);
      }
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

  const officeHeader = (
     <div className="flex items-center justify-center">
      <h1 className="text-xl md:text-2xl font-bold text-card-foreground">
        Panel de Asistencia - {office.name}
      </h1>
    </div>
  )

  const manualOffices = offices.filter(office => !office.name.toLowerCase().includes('movil'));


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
               </div>
            </header>
            
            <Tabs defaultValue="staffing" className="w-full">
              <TabsList className='mb-4 grid w-full grid-cols-2'>
                <TabsTrigger value="staffing">Dotación Asignada</TabsTrigger>
                <TabsTrigger value="report">Reporte Diario</TabsTrigger>
              </TabsList>
              <TabsContent value="staffing">
                <DraggableStaffDashboard 
                  offices={offices} 
                  employees={employees} 
                  onEmployeeUpdate={handleEmployeeUpdated}
                  onRefreshData={refetchAllData}
                />
              </TabsContent>
              <TabsContent value="report" className="space-y-8">
                 <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditStaffingModalOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar Dotación Teórica
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate || undefined}
                          onSelect={(date) => date && setSelectedDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Button onClick={handleSaveDay} disabled={isSavingDay || !selectedDate}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSavingDay ? 'Guardando...' : 'Guardar Día'}
                    </Button>
                  </div>

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
                          <ManualEntryTable ref={manualEntryTableRef} offices={manualOffices} employees={employees} />
                        )}
                      </CardContent>
                    </div>
                    <CardFooter className="flex justify-end items-center p-2 exclude-from-image bg-card">
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="ghost" onClick={() => setClearAlertOpen(true)} title="Limpiar Ingresos">
                            <Eraser className="h-5 w-5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={handleGenerateSummaryImage} disabled={isGeneratingSummary} title="Copiar Imagen del Resumen">
                            <Camera className="h-5 w-5" />
                          </Button>
                        </div>
                    </CardFooter>
                  </Card>

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
                          <Button size="icon" variant="ghost" onClick={handleGenerateAbsenceImage} disabled={isGeneratingAbsence} title="Copiar Imagen de Ausencias">
                              <Camera className="h-5 w-5" />
                          </Button>
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
            </Tabs>
          </>
      </main>
    </div>
    <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={refetchAllData}
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
        onSuccess={refetchAllData}
        offices={offices}
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
    </>
  );
}
