import Link from 'next/link';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { getEmployees, getOfficeBySlug, getOffices } from '@/lib/data';
import DashboardClient from '@/components/DashboardClient';
import { Button } from '@/components/ui/button';

type DashboardPageProps = {
  params: {
    officeId: string;
  };
};

export default function DashboardPage({ params }: DashboardPageProps) {
  const { officeId } = params;
  const initialEmployees = getEmployees(officeId);
  const offices = getOffices();
  const office = officeId === 'general' ? { name: 'Panel General' } : getOfficeBySlug(officeId);

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
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-primary-foreground">{office.name}</h1>
        </div>
        <Link href="/dashboard/add-employee">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Ejecutivo
          </Button>
        </Link>
      </header>
      <main className="flex-1 overflow-auto">
        <DashboardClient initialEmployees={initialEmployees} offices={offices} />
      </main>
    </div>
  );
}
