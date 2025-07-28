
"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOffices, Office, getEmployees, Employee } from '@/lib/data';
import ManualEntryTable from '@/components/ManualEntryTable';
import ProlongedAbsenceTable from '@/components/ProlongedAbsenceTable';
import { Skeleton } from '@/components/ui/skeleton';

export default function ManualEntryPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

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
      </header>
      <main className="flex-1 p-4 md:p-8 space-y-8">
        <Card className="w-full">
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

    