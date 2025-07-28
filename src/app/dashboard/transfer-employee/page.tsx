
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getEmployees, getOffices, Office, Employee } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import TransferEmployeeModal from '@/components/TransferEmployeeModal';
import { Separator } from '@/components/ui/separator';

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
    setEmployees(fetchedEmployees);
    setOffices(fetchedOffices);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const officeMap = useMemo(() => new Map(offices.map(o => [o.id, o.name])), [offices]);

  const employeesByOffice = useMemo(() => {
    if (loading) return {};
    return employees.reduce((acc, employee) => {
      const officeName = officeMap.get(employee.officeId) || 'Sin Oficina';
      if (!acc[officeName]) {
        acc[officeName] = [];
      }
      acc[officeName].push(employee);
      return acc;
    }, {} as Record<string, Employee[]>);
  }, [employees, officeMap, loading]);


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
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Lista de Personal</CardTitle>
              <CardDescription>
                Haz clic en el icono de traslado para reasignar un ejecutivo a una nueva oficina.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-2 space-y-1 max-h-[60vh] overflow-y-auto">
                 {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-3 p-2">
                        <Skeleton className="h-6 w-1/3" />
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      </div>
                    ))
                ) : (
                  Object.keys(employeesByOffice).sort().map(officeName => (
                    <div key={officeName} className="py-2">
                      <h3 className="font-semibold text-primary px-2 pb-2">{officeName}</h3>
                      <div className="space-y-1">
                        {employeesByOffice[officeName].sort((a,b) => a.name.localeCompare(b.name)).map(employee => (
                          <div key={employee.id} className="flex items-center justify-between p-1.5 rounded-md hover:bg-muted/50">
                              <p className="font-medium text-sm">{employee.name}</p>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(employee)}>
                                  <Shuffle className="h-4 w-4 text-primary" />
                              </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
                
                {!loading && employees.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                        No hay personal para mostrar.
                    </p>
                )}
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
