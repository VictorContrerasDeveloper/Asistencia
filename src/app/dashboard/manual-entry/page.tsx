"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, PlusCircle, Save, CalendarIcon, Trash2, Eraser, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getOffices, Office, getEmployees, Employee, saveDailySummary, getDailySummaries, DailySummary, deleteDailySummary } from '@/lib/data';
import ManualEntryTable from '@/components/ManualEntryTable';
import ProlongedAbsenceTable from '@/components/ProlongedAbsenceTable';
import DailySummaryTable from '@/components/DailySummaryTable';
import { Skeleton } from '@/components/ui/skeleton';
import html2canvas from 'html2canvas';
import AddAbsenceModal from '@/components/AddAbsenceModal';
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ManualEntryPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingAbsence, setIsGeneratingAbsence] = useState(false);
  const [isSavingDay, setIsSavingDay] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const manualEntryTableRef = React.useRef<{ getSummaryData: () => any; clearRealStaffing: () => void; }>(null);
  const [summaryToDelete, setSummaryToDelete] = useState<string | null>(null);
  const [isClearAlertOpen, setClearAlertOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [fetchedOffices, fetchedEmployees, fetchedSummaries] = await Promise.all([
      getOffices(),
      getEmployees(),
      getDailySummaries(),
    ]);
    const filteredOffices = fetchedOffices.filter(office => !office.name.toLowerCase().includes('movil'));
    setOffices(filteredOffices);
    setEmployees(fetchedEmployees);
    setDailySummaries(fetchedSummaries);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

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
    const originalValues: { el: HTMLTableCellElement, originalContent: string, originalPadding: string }[] = [];

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

  const handleClearRealStaffing = () => {
    if (manualEntryTableRef.current) {
      manualEntryTableRef.current.clearRealStaffing();
    }
    setClearAlertOpen(false);
  };


  return (
    <>
      <div className="flex flex-col min-h-screen bg-background">
        <header className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-card-foreground">Ingreso Manual de Asistencia</h1>
          </div>
           <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
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
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleSaveDay} disabled={isSavingDay}>
                <Save className="mr-2 h-4 w-4" />
                {isSavingDay ? 'Guardando...' : 'Guardar Día'}
            </Button>
           </div>
        </header>
        <main className="flex-1 p-4 md:p-8 space-y-8">
            <Card id="manual-entry-summary" className="w-full overflow-hidden">
              <div className="border-b">
                <CardHeader className="flex flex-row items-center justify-center p-4">
                  <CardTitle>Resumen dotacion Of. Com. Helpbank</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2 p-6">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <ManualEntryTable ref={manualEntryTableRef} offices={offices} employees={employees} />
                  )}
                </CardContent>
              </div>
               <CardFooter className="flex justify-between items-center p-2 exclude-from-image bg-card">
                 <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Link href="/dashboard/transfer-employee">
                          <Button variant="ghost" size="icon">
                              <Shuffle className="h-5 w-5" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Modificar asignación de dotacion</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                    <CardContent>
                        {loading ? (
                        <div className="p-6">
                            <Skeleton className="h-40 w-full" />
                        </div>
                        ) : (
                            <ProlongedAbsenceTable 
                                offices={offices} 
                                employees={employees}
                                onEmployeeReinstated={handleEmployeeReinstated}
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

        </main>
      </div>
       <AddAbsenceModal 
          isOpen={isAbsenceModalOpen}
          onClose={() => setIsAbsenceModalOpen(false)}
          onAbsenceAdded={handleAbsenceAdded}
          allEmployees={employees}
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
