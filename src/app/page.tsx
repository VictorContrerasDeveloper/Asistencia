
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Globe, FilePen, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function Home() {

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
       <div className="w-full max-w-md text-center mb-8">
         <Image
            src="https://firebasestorage.googleapis.com/v0/b/attendance-hero-av2o3.firebasestorage.app/o/Helpbank.avif?alt=media&token=98d20f3c-619f-427b-bde3-46efdf9da64d"
            alt="Helpbank Logo"
            width={400}
            height={267}
            className="rounded-lg shadow-md mb-8 mx-auto"
            priority
          />
        <h1 className="text-4xl sm:text-5xl font-bold text-primary tracking-tight">Control de Asistencia</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Una solución centralizada para gestionar la asistencia diaria del personal.
        </p>
      </div>

      <div className="w-full max-w-md text-center">
         <Link href="/dashboard/general" className="group">
           <Button size="lg" className="w-full text-lg py-8">
              <LayoutDashboard className="mr-4 h-6 w-6" />
              Ir al Panel de Control
           </Button>
         </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Accede al panel unificado para gestionar toda la información.
          </p>
      </div>
    </main>
  );
}
