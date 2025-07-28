
"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getOffices, Office, getEmployees, Employee } from '@/lib/data';
import ManualEntryTable from '@/components/ManualEntryTable';
import ProlongedAbsenceTable from '@/components/ProlongedAbsenceTable';

export default function ManualEntryPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [fetchedOffices, fetchedEmployees] = await Promise.all([
        getOffices(),
        getEmployees(), // Fetch all employees
      ]);
      const filteredOffices = fetchedOffices.filter(office => !office.name.toLowerCase().includes('movil'));
      filteredOffices.sort((a, b) => a.name.localeCompare(b.name));
      setOffices(filteredOffices);
      setEmployees(fetchedEmployees);
      setLoading(false);
    }
    fetchData();
  }, []);

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
            <CardDescription className="text-center">
              Ingresa la cantidad de personal presente para cada rol en las oficinas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Cargando datos...</p>
            ) : (
              <ManualEntryTable offices={offices} employees={employees} />
            )}
          </CardContent>
        </Card>

        {loading ? (
          <p>Cargando ausencias...</p>
        ) : (
          <ProlongedAbsenceTable offices={offices} employees={employees} />
        )}

      </main>
    </div>
  );
}
