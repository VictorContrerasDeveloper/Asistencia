
"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getOffices, Office, getEmployees, Employee } from '@/lib/data';
import ManualEntryTable from '@/components/ManualEntryTable';
import ProlongedAbsenceTable from '@/components/ProlongedAbsenceTable';
import { Skeleton } from '@/components/ui/skeleton';
import html2canvas from 'html2canvas';
import AddAbsenceModal from '@/components/AddAbsenceModal';

export default function ManualEntryPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingAbsence, setIsGeneratingAbsence] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [fetchedOffices, fetchedEmployees] = await Promise.all([
        getOffices(),
        getEmployees(),
      ]);
      const filteredOffices = fetchedOffices.filter(office => !office.name.toLowerCase().includes('movil'));
      setOffices(filteredOffices);
      setEmployees(fetchedEmployees);
      setLoading(false);
    }
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
    setIsModalOpen(false);
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
        </header>
        <main className="flex-1 p-4 md:p-8 space-y-8">
            <Card id="manual-entry-summary" className="w-full overflow-hidden">
              <div>
                <CardHeader className="flex flex-row items-center justify-center p-4">
                  <CardTitle>Resumen dotacion Of. Com. Helpbank</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <ManualEntryTable offices={offices} employees={employees} />
                  )}
                </CardContent>
              </div>
               <CardFooter className="flex justify-end p-2 exclude-from-image bg-card">
                  <Button size="icon" variant="ghost" onClick={handleGenerateSummaryImage} disabled={isGeneratingSummary}>
                    <Camera className="h-5 w-5" />
                  </Button>
              </CardFooter>
            </Card>

            <Card id="prolonged-absence-summary" className="w-full overflow-hidden">
                <div>
                    <CardHeader className="relative flex flex-row items-center justify-center p-4 text-center">
                        <CardTitle className="w-full">Ausencias Prolongadas</CardTitle>
                        <div className="absolute right-4 flex items-center gap-2 exclude-from-image">
                            <Button size="sm" onClick={() => setIsModalOpen(true)}>
                                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                                Agregar
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                        <Skeleton className="h-40 w-full" />
                        ) : (
                        <ProlongedAbsenceTable 
                            offices={offices} 
                            employees={employees}
                            onEmployeeReinstated={handleEmployeeReinstated}
                        />
                        )}
                    </CardContent>
                </div>
                <CardFooter className="flex justify-end p-2 exclude-from-image bg-card">
                     <Button size="icon" variant="ghost" onClick={handleGenerateAbsenceImage} disabled={isGeneratingAbsence}>
                        <Camera className="h-5 w-5" />
                    </Button>
                </CardFooter>
            </Card>
        </main>
      </div>
       <AddAbsenceModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAbsenceAdded={handleAbsenceAdded}
          allEmployees={employees}
      />
    </>
  );
}

