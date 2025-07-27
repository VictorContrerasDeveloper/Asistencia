
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getOffices, slugify } from '@/lib/data';
import { Building, Globe, FilePen } from 'lucide-react';

export default async function Home() {
  const offices = await getOffices();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-4xl text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary-foreground tracking-tight">Control de Asistencia</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Selecciona un panel para gestionar la asistencia diaria del personal.
        </p>
      </div>

      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/dashboard/general" className="group">
            <Card className="h-full hover:border-primary hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-col items-center justify-center text-center p-6">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Panel General</CardTitle>
                <CardDescription className="mt-2">Ver todas las oficinas combinadas</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          
          <Link href="/dashboard/manual-entry" className="group">
            <Card className="h-full hover:border-primary hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-col items-center justify-center text-center p-6">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <FilePen className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Ingreso Manual</CardTitle>
                <CardDescription className="mt-2">Registrar asistencia por totales</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {offices.map((office) => (
            <Link href={`/dashboard/${slugify(office.name)}`} key={office.id} className="group">
              <Card className="h-full hover:border-primary hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <CardHeader className="flex flex-col items-center justify-center text-center p-6">
                   <div className="p-4 bg-accent/10 rounded-full mb-4">
                    <Building className="h-8 w-8 text-accent" />
                  </div>
                  <CardTitle className="text-xl font-semibold">{office.name}</CardTitle>
                  <CardDescription className="mt-2">Ver oficina específica</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
