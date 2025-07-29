
"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getEmployees, bulkUpdateEmployeeLevels, Employee, EmployeeLevel } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import BulkUpdateNamesModal from '@/components/BulkUpdateNamesModal';

const LEVELS: EmployeeLevel[] = ['Nivel 1', 'Nivel 2', 'Nivel intermedio', 'Nivel Básico'];

export default function BulkUpdateLevelsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [levelChanges, setLevelChanges] = useState<Record<string, EmployeeLevel>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdateNamesModalOpen, setUpdateNamesModalOpen] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    const allEmployees = await getEmployees();
    setEmployees(allEmployees);
    setLoading(false);
  }

  useEffect(() => {
    fetchEmployees();
  }, []);
  
  const handleLevelChange = (employeeId: string, newLevel: EmployeeLevel) => {
    setLevelChanges(prev => ({...prev, [employeeId]: newLevel}));
  }

  const getEmployeeLevel = (employee: Employee): EmployeeLevel => {
    return levelChanges[employee.id] || employee.level || 'Nivel Básico';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(levelChanges).length === 0) {
      toast({
        title: "Sin cambios",
        description: "No has modificado ningún nivel.",
      });
      return;
    }
    setIsSaving(true);
    try {
      const updates = Object.entries(levelChanges).map(([employeeId, level]) => ({ employeeId, level }));
      await bulkUpdateEmployeeLevels(updates);
      toast({
        title: "Actualización Exitosa",
        description: `Se han actualizado los niveles de ${updates.length} ejecutivo(s).`
      })
      router.push('/dashboard/general');
    } catch (error) {
       toast({
        title: "Error",
        description: "Ocurrió un error al actualizar los niveles.",
        variant: "destructive",
      });
    } finally {
        setIsSaving(false);
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
            <h1 className="text-xl md:text-2xl font-bold text-card-foreground">Gestión Masiva del Personal</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setUpdateNamesModalOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Actualizar Nombres
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving || loading}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Guardando...' : 'Guardar Cambios de Nivel'}
            </Button>
          </div>
        </header>
        <main className="flex-1 flex justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Niveles del Personal</CardTitle>
              <CardDescription>
                Modifica el nivel de cada ejecutivo desde esta tabla. Los cambios se guardarán todos juntos al presionar el botón superior.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[70vh] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="w-[200px]">Nivel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      employees.map(employee => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>
                            <Select
                              value={getEmployeeLevel(employee)}
                              onValueChange={(value) => handleLevelChange(employee.id, value as EmployeeLevel)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un nivel" />
                              </SelectTrigger>
                              <SelectContent>
                                {LEVELS.map(level => (
                                  <SelectItem key={level} value={level}>{level}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </main>
      </div>
       <BulkUpdateNamesModal
        isOpen={isUpdateNamesModalOpen}
        onClose={() => setUpdateNamesModalOpen(false)}
        onSuccess={fetchEmployees}
      />
    </>
  );
}
