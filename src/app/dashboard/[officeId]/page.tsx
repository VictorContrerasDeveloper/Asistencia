
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { getEmployees, getOfficeBySlug, getOffices } from '@/lib/data';
import DashboardClient from '@/components/DashboardClient';
import { Button } from '@/components/ui/button';

type DashboardPageProps = {
  params: {
    officeId: string;
  };
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { officeId } = params;
  const offices = await getOffices();
  const office = officeId === 'general' ? { name: 'Panel General', id: 'general' } : await getOfficeBySlug(officeId);
  const initialEmployees = await getEmployees(officeId);

  if (!office) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Oficina no encontrada</h1>
        <Link href="/">
          <Button>Volver a la selección</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex flex-col items-center justify-center p-6 md:p-8 border-b bg-card">
        <h1 className="text-3xl md:text-4xl font-bold text-card-foreground">Panel de Asistencia - {office.name}</h1>
        <p className="text-muted-foreground mt-2">Gestiona la asistencia del personal de tu oficina.</p>
        <div className="flex items-center gap-4 mt-6">
           <Link href="/">
              <Button variant="outline">
                <ArrowLeft />
                Volver al Inicio
              </Button>
            </Link>
            {officeId !== 'general' && (
              <Link href={`/dashboard/${officeId}/report`}>
                <Button>
                  <FileText />
                  Ver Reporte Diario
                </Button>
              </Link>
            )}
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <DashboardClient initialEmployees={initialEmployees} offices={offices} officeName={office.name} officeId={officeId} />
      </main>
    </div>
  );
}
