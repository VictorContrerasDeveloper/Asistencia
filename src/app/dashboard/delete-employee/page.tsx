
"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getEmployees, bulkDeleteEmployees, Employee } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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

export default function DeleteEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      const allEmployees = await getEmployees();
      allEmployees.sort((a, b) => a.name.localeCompare(b.name));
      setEmployees(allEmployees);
    }
    fetchEmployees();
  }, []);

  const handleSelectEmployee = (employeeId: string, checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    }
  };

  const handleDelete = async () => {
    setAlertOpen(false);
    if (selectedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "No has seleccionado ningún ejecutivo para eliminar.",
        variant: "destructive",
      });
      return;
    }
    setIsDeleting(true);
    try {
      await bulkDeleteEmployees(selectedEmployees);
      toast({
          title: "¡Éxito!",
          description: "Los ejecutivos seleccionados han sido eliminados.",
      });
      router.push('/dashboard/general');
    } catch (error) {
       toast({
        title: "Error",
        description: "Ocurrió un error al eliminar los ejecutivos.",
        variant: "destructive",
      });
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background">
         <header className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/general">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-card-foreground">Eliminar Ejecutivos</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Seleccionar Ejecutivos</CardTitle>
              <CardDescription>
                Marca las casillas de los ejecutivos que deseas eliminar permanentemente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ScrollArea className="h-72 w-full rounded-md border p-4">
                    <div className="space-y-2">
                        {employees.map(employee => (
                            <div key={employee.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`employee-${employee.id}`}
                                    onCheckedChange={(checked) => handleSelectEmployee(employee.id, checked)}
                                />
                                <Label htmlFor={`employee-${employee.id}`} className="flex-1 cursor-pointer">{employee.name}</Label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="flex justify-end gap-2">
                   <Link href="/dashboard/general">
                      <Button variant="outline" type="button" disabled={isDeleting}>
                          Cancelar
                      </Button>
                   </Link>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    disabled={isDeleting || selectedEmployees.length === 0}
                    onClick={() => setAlertOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isDeleting ? 'Eliminando...' : `Eliminar (${selectedEmployees.length})`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente a {selectedEmployees.length} ejecutivo(s).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
