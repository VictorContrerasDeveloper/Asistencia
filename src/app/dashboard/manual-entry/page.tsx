
"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOffices, Office, getEmployees, Employee } from '@/lib/data';
import ManualEntryTable from '@/components/ManualEntryTable';
import ProlongedAbsenceTable from '@/components/ProlongedAbsenceTable';
import { Skeleton } from '@/components/ui/skeleton';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import AddAbsenceModal from '@/components/AddAbsenceModal';

export default function ManualEntryPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingAbsence, setIsGeneratingAbsence] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

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
                 toast({
                    title: "¡Éxito!",
                    description: "Imagen copiada al portapapeles.",
                });
            } catch (err) {
                 toast({
                    title: "Error",
                    description: "No se pudo copiar la imagen.",
                    variant: "destructive"
                });
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
    const originalDisplays: { el: HTMLElement, display: string}[] = [];
    const createdSpans: HTMLElement[] = [];

    inputs.forEach((input) => {
        const inputEl = input as HTMLInputElement;
        const span = document.createElement('span');
        span.textContent = inputEl.value || '0';
        span.className = inputEl.className.replace('w-12', 'w-full block').replace('h-7', 'h-full'); 
        span.classList.add('text-center');

        if (inputEl.className.includes('bg-red-600')) {
             span.classList.add('bg-red-600', 'text-white');
        }
        originalDisplays.push({el: inputEl, display: inputEl.style.display });
        inputEl.style.display = 'none';
        inputEl.parentNode?.insertBefore(span, inputEl.nextSibling);
        createdSpans.push(span);
    });

    try {
      const canvas = await html2canvas(summaryTable, { scale: 2 });
      await copyCanvasToClipboard(canvas);
    } catch (error) {
       toast({
          title: "Error",
          description: "No se pudo generar la imagen del resumen.",
          variant: "destructive"
      });
    } finally {
        createdSpans.forEach(span => span.parentNode?.removeChild(span));
        originalDisplays.forEach(item => item.el.style.display = item.display);
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
      const canvas = await html2canvas(absenceTable, { scale: 2 });
      await copyCanvasToClipboard(canvas);
    } catch (error) {
       toast({
          title: "Error",
          description: "No se pudo generar la imagen de ausencias.",
          variant: "destructive"
      });
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
            <Card id="manual-entry-summary" className="w-full">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <CardTitle>Resumen dotacion Of. Com. Helpbank</CardTitle>
                <Button size="sm" onClick={handleGenerateSummaryImage} disabled={isGeneratingSummary}>
                  <Camera className="mr-2 h-4 w-4" />
                  Copiar Resumen
                </Button>
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
            </Card>

            <Card id="prolonged-absence-summary" className="w-full">
               <CardHeader className="flex flex-row items-center justify-between p-4">
                 <CardTitle>Ausencias Prolongadas</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => setIsModalOpen(true)} className="exclude-from-image">
                        <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                        Agregar
                    </Button>
                     <Button size="sm" onClick={handleGenerateAbsenceImage} disabled={isGeneratingAbsence}>
                        <Camera className="mr-2 h-4 w-4" />
                        Copiar Ausencias
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
