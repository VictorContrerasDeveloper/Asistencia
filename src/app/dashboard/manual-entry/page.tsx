
"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOffices, Office, getEmployees, Employee } from '@/lib/data';
import ManualEntryTable from '@/components/ManualEntryTable';
import ProlongedAbsenceTable from '@/components/ProlongedAbsenceTable';
import { Skeleton } from '@/components/ui/skeleton';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';

export default function ManualEntryPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
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

   const handleEmployeeUpdate = (updatedEmployee: Employee) => {
    setEmployees(prev => 
      prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp)
    );
  };

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
  }

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    toast({
      title: "Generando imagen...",
      description: "Esto puede tardar unos segundos.",
    });

    const summaryTable = document.getElementById('manual-entry-summary');
    const absenceTable = document.getElementById('prolonged-absence-summary');

    if (!summaryTable || !absenceTable) {
        toast({ title: "Error", description: "No se encontraron las tablas para generar la imagen.", variant: "destructive" });
        setIsGeneratingImage(false);
        return;
    }

    // --- Prepare tables for capturing ---

    // 1. Temporarily replace inputs with spans for html2canvas
    const inputs = summaryTable.querySelectorAll('input[type="number"]');
    const originalDisplays: { el: HTMLElement, display: string}[] = [];
    inputs.forEach((input) => {
        const inputEl = input as HTMLInputElement;
        const span = document.createElement('span');
        span.textContent = inputEl.value || '0';
        span.className = inputEl.className.replace('w-12', 'w-full block').replace('h-7', 'h-full'); 
        if (inputEl.className.includes('bg-red-600')) {
             span.classList.add('bg-red-600', 'text-white');
        }
        originalDisplays.push({el: inputEl, display: inputEl.style.display });
        inputEl.style.display = 'none';
        inputEl.parentNode?.insertBefore(span, inputEl.nextSibling);
    });

    // 2. Hide elements not meant for the image
    const elementsToHide = document.querySelectorAll('.exclude-from-image');
    elementsToHide.forEach(el => {
        const htmlEl = el as HTMLElement;
        originalDisplays.push({el: htmlEl, display: htmlEl.style.display });
        htmlEl.style.display = 'none';
    })


    try {
      const summaryCanvas = await html2canvas(summaryTable, { scale: 2 });
      const absenceCanvas = await html2canvas(absenceTable, { scale: 2 });

      const combinedCanvas = document.createElement('canvas');
      const context = combinedCanvas.getContext('2d');
      if (!context) return;
      
      const spacing = 40;
      combinedCanvas.width = Math.max(summaryCanvas.width, absenceCanvas.width);
      combinedCanvas.height = summaryCanvas.height + absenceCanvas.height + spacing;

      context.fillStyle = 'white';
      context.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
      context.drawImage(summaryCanvas, 0, 0);
      context.drawImage(absenceCanvas, 0, summaryCanvas.height + spacing);

      combinedCanvas.toBlob(async (blob) => {
        if(blob) {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                toast({
                    title: "¡Imagen copiada!",
                    description: "La imagen ha sido copiada al portapapeles. Ya puedes pegarla.",
                });
            } catch (err) {
                 console.error("Error copying to clipboard:", err);
                 toast({ title: "Error", description: "No se pudo copiar la imagen al portapapeles.", variant: "destructive" });
            }
        }
      }, 'image/png');
      
    } catch (error) {
      console.error("Error generating image:", error);
      toast({ title: "Error", description: "No se pudo generar la imagen.", variant: "destructive" });
    } finally {
        // --- Restore original elements ---
        
        // 1. Restore inputs
        inputs.forEach((input) => {
            const span = input.nextSibling;
            if (span && span.nodeName === 'SPAN') {
                span.parentNode?.removeChild(span);
            }
        });

        // 2. Restore all hidden elements
        originalDisplays.forEach(item => {
            item.el.style.display = item.display;
        })
        
        setIsGeneratingImage(false);
    }
  }


  return (
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
        <Button onClick={handleGenerateImage} disabled={isGeneratingImage}>
          <Camera className="mr-2 h-4 w-4" />
          {isGeneratingImage ? "Generando..." : "Generar Imagen"}
        </Button>
      </header>
      <main className="flex-1 p-4 md:p-8 space-y-8">
        <Card id="manual-entry-summary" className="w-full">
          <CardHeader>
            <CardTitle className="text-center">Resumen dotacion Of. Com. Helpbank</CardTitle>
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

        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <ProlongedAbsenceTable 
            id="prolonged-absence-summary"
            offices={offices} 
            employees={employees}
            onAbsenceAdded={handleAbsenceAdded}
            onEmployeeReinstated={handleEmployeeReinstated}
           />
        )}

      </main>
    </div>
  );
}

    
