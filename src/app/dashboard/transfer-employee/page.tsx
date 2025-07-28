
"use client"

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getOffices, getEmployees, updateEmployee, Office, Employee } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

export default function TransferEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [fetchedEmployees, fetchedOffices] = await Promise.all([
        getEmployees(),
        getOffices()
    ]);
    setEmployees(fetchedEmployees);
    setOffices(fetchedOffices);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const officeMap = useMemo(() => new Map(offices.map(o => [o.id, o.name])), [offices]);

  const handleOfficeChange = async (employeeId: string, newOfficeId: string) => {
    const originalEmployees = [...employees];
    const employee = employees.find(e => e.id === employeeId);
    if (!employee || employee.officeId === newOfficeId) return;

    // Optimistic update
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, officeId: newOfficeId } : e));

    try {
      await updateEmployee(employeeId, { officeId: newOfficeId });
    } catch (error) {
      setEmployees(originalEmployees);
      toast({
        title: "Error",
        description: "No se pudo trasladar al ejecutivo.",
        variant: "destructive",
      });
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
      </header>
      <main className="flex-1 flex justify-center p-4 md:p-8">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle>Lista de Personal</CardTitle>
            <CardDescription>
              Selecciona una nueva oficina para cualquier ejecutivo. El cambio se guardará automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="font-bold">Nombre Ejecutivo</TableHead>
                        <TableHead className="font-bold">Oficina Actual</TableHead>
                        <TableHead className="font-bold w-[300px]">Nueva Oficina</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            employees.map((employee) => (
                                <TableRow key={employee.id}>
                                <TableCell className="font-medium">{employee.name}</TableCell>
                                <TableCell>{officeMap.get(employee.officeId) || 'N/A'}</TableCell>
                                <TableCell>
                                    <Select
                                        value={employee.officeId}
                                        onValueChange={(newOfficeId) => handleOfficeChange(employee.id, newOfficeId)}
                                    >
                                        <SelectTrigger>
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
