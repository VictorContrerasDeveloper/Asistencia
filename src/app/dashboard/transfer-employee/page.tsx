
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getOffices, getEmployees, updateEmployee, Office, Employee } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

type PendingChanges = {
    [employeeId: string]: string;
};

export default function TransferEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [fetchedEmployees, fetchedOffices] = await Promise.all([
        getEmployees(),
        getOffices()
    ]);
    setEmployees(fetchedEmployees.sort((a,b) => a.name.localeCompare(b.name)));
    setOffices(fetchedOffices);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const officeMap = useMemo(() => new Map(offices.map(o => [o.id, o.name])), [offices]);

  const employeesByOffice = useMemo(() => {
    return employees.reduce((acc, employee) => {
        const officeName = officeMap.get(employee.officeId) || 'Sin Oficina Asignada';
        if (!acc[officeName]) {
            acc[officeName] = [];
        }
        acc[officeName].push(employee);
        return acc;
    }, {} as Record<string, Employee[]>);
  }, [employees, officeMap]);

  const handleOfficeChange = (employeeId: string, newOfficeId: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [employeeId]: newOfficeId
    }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const changesToProcess = Object.entries(pendingChanges);

    if (changesToProcess.length === 0) {
      toast({
        title: "No hay cambios",
        description: "No has realizado ningún cambio para guardar.",
      });
      setIsSaving(false);
      return;
    }

    const updatePromises = changesToProcess.map(([employeeId, officeId]) =>
      updateEmployee(employeeId, { officeId })
    );

    try {
      await Promise.all(updatePromises);
      toast({
        title: "Éxito",
        description: `Se han guardado ${changesToProcess.length} cambio(s) correctamente.`,
      });
      setPendingChanges({});
      await fetchData(); // Refresh data from DB
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar todos los cambios.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
       <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/manual-entry">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-card-foreground">Trasladar Personal</h1>
        </div>
         <Button onClick={handleSaveChanges} disabled={isSaving || Object.keys(pendingChanges).length === 0}>
            <Save className="mr-2 h-4 w-4"/>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </header>
      <main className="flex-1 flex justify-center p-4 md:p-8">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle>Lista de Personal por Oficina</CardTitle>
            <CardDescription>
              Selecciona una nueva oficina para cualquier ejecutivo y guarda los cambios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="font-bold w-[30%]">Oficina Actual</TableHead>
                        <TableHead className="font-bold">Nombre Ejecutivo</TableHead>
                        <TableHead className="font-bold w-[35%]">Nueva Oficina</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                       {loading ? (
                          Array.from({ length: 10 }).map((_, i) => (
                              <TableRow key={i}>
                                  <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                                  <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                                  <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                              </TableRow>
                          ))
                      ) : (
                        Object.keys(employeesByOffice).sort().map(officeName => (
                            <React.Fragment key={officeName}>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableCell colSpan={3} className="font-semibold text-primary py-2">
                                        {officeName}
                                    </TableCell>
                                </TableRow>
                                {employeesByOffice[officeName].map((employee) => {
                                    const currentOfficeId = pendingChanges[employee.id] || employee.officeId;
                                    return (
                                        <TableRow key={employee.id} className="h-12">
                                            <TableCell className="py-0"></TableCell>
                                            <TableCell className="font-medium py-0">{employee.name}</TableCell>
                                            <TableCell className="py-0">
                                                <Select
                                                    value={currentOfficeId}
                                                    onValueChange={(newOfficeId) => handleOfficeChange(employee.id, newOfficeId)}
                                                >
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Seleccionar nueva oficina" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {offices.map((office) => (
                                                            <SelectItem key={office.id} value={office.id}>
                                                                {office.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </React.Fragment>
                        ))
                      )}

                         {!loading && employees.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                    No hay personal para mostrar.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
