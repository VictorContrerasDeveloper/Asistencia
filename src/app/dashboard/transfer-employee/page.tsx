
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getOffices, getEmployees, Office, Employee } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import TransferEmployeeModal from '@/components/TransferEmployeeModal';

export default function TransferEmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

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


  const handleOpenModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };
  
  const handleTransferSuccess = async () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
    await fetchData(); // Refresh data
  }


  return (
    <>
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
              <CardTitle>Lista de Personal por Oficina</CardTitle>
              <CardDescription>
                Haz clic en el icono de traslado para reasignar un ejecutivo a una nueva oficina.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                  <Table>
                      <TableHeader>
                          <TableRow>
                          <TableHead className="font-bold w-[40%]">Oficina Actual</TableHead>
                          <TableHead className="font-bold">Nombre Ejecutivo</TableHead>
                          <TableHead className="font-bold text-right w-[100px]">Acción</TableHead>
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
                                  {employeesByOffice[officeName].map((employee) => (
                                      <TableRow key={employee.id} className="h-12">
                                          <TableCell className="py-0"></TableCell>
                                          <TableCell className="font-medium py-0">{employee.name}</TableCell>
                                          <TableCell className="py-0 text-right">
                                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(employee)}>
                                                  <Shuffle className="h-4 w-4 text-primary" />
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
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
      {selectedEmployee && (
        <TransferEmployeeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          employee={selectedEmployee}
          offices={offices}
          onSuccess={handleTransferSuccess}
        />
      )}
    </>
  );
}
