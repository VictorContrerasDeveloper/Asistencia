
"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getOffices, Office } from '@/lib/data';
import ManualEntryTable from '@/components/ManualEntryTable';

export default function ManualEntryPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffices = async () => {
      const fetchedOffices = await getOffices();
      setOffices(fetchedOffices);
      setLoading(false);
    }
    fetchOffices();
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
      <main className="flex-1 p-4 md:p-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Ejecutivas SI presentes en oficina</CardTitle>
            <CardDescription>
              Ingresa la cantidad de personal presente para cada rol en las oficinas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Cargando oficinas...</p>
            ) : (
              <ManualEntryTable offices={offices} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
