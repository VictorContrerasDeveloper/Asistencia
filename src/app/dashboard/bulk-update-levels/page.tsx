
"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getEmployees, bulkUpdateEmployeeLevels, bulkUpdateEmployeeNames, Employee, EmployeeLevel } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const LEVELS: EmployeeLevel[] = ['Nivel 1', 'Nivel 2', 'Nivel intermedio', 'Nivel Básico'];

export default function BulkUpdateLevelsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [levelChanges, setLevelChanges] = useState<Record<string, EmployeeLevel>>({});
  const [nameChanges, setNameChanges] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      const allEmployees = await getEmployees();
      setEmployees(allEmployees);
      
      const initialNameChanges: Record<string, string> = {};
      allEmployees.forEach(emp => {
          initialNameChanges[emp.id] = emp.name;
      });
      setNameChanges(initialNameChanges);

      setLoading(false);
    }
    fetchEmployees();
  }, []);
  
  const handleLevelChange = (employeeId: string, newLevel: EmployeeLevel) => {
    setLevelChanges(prev => ({...prev, [employeeId]: newLevel}));
  }

  const handleNameChange = (employeeId: string, newName: string) => {
    setNameChanges(prev => ({...prev, [employeeId]: newName}));
  }

  const getEmployeeLevel = (employee: Employee): EmployeeLevel => {
    return levelChanges[employee.id] || employee.level || 'Nivel Básico';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const levelUpdates = Object.entries(levelChanges).map(([employeeId, level]) => ({ employeeId, level }));
    
    const nameUpdates = Object.entries(nameChanges)
        .filter(([employeeId, newName]) => {
            const originalEmployee = employees.find(emp => emp.id === employeeId);
            return originalEmployee && originalEmployee.name !== newName && newName.trim() !== '';
        })
        .map(([employeeId, name]) => ({ employeeId, name }));

    if (levelUpdates.length === 0 && nameUpdates.length === 0) {
      toast({
        title: "Sin cambios",
        description: "No has modificado ningún dato.",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (levelUpdates.length > 0) {
        await bulkUpdateEmployeeLevels(levelUpdates);
      }
      if (nameUpdates.length > 0) {
        await bulkUpdateEmployeeNames(nameUpdates);
      }
      toast({
        title: "Actualización Exitosa",
        description: `Se han actualizado los datos.`
      })
      router.push('/dashboard/general');
    } catch (error) {
       toast({
        title: "Error",
        description: "Ocurrió un error al actualizar los datos.",
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
            <Button onClick={handleSubmit} disabled={isSaving || loading}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </header>
        <main className="flex-1 flex justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Datos del Personal</CardTitle>
              <CardDescription>
                Modifica los datos de cada ejecutivo desde esta tabla. Los cambios se guardarán todos juntos al presionar el botón superior.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="levels" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="levels">Niveles</TabsTrigger>
                  <TabsTrigger value="names">Nombres</TabsTrigger>
                </TabsList>
                <TabsContent value="levels">
                  <ScrollArea className="h-[65vh] w-full mt-4">
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
                </TabsContent>
                <TabsContent value="names">
                  <ScrollArea className="h-[65vh] w-full mt-4">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card">
                        <TableRow>
                          <TableHead>Nombre Actual</TableHead>
                          <TableHead>Nombre Nuevo</TableHead>
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
                                <Input 
                                  value={nameChanges[employee.id] || ''}
                                  onChange={(e) => handleNameChange(employee.id, e.target.value)}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
