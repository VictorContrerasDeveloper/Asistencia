
"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getEmployees, bulkUpdateEmployeeNames, Employee } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function BulkUpdateNamesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [nameUpdates, setNameUpdates] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      const allEmployees = await getEmployees();
      allEmployees.sort((a, b) => a.name.localeCompare(b.name));
      setEmployees(allEmployees);
    }
    fetchEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameUpdates) {
      toast({
        title: "Error",
        description: "El campo de texto está vacío.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const { updated, notFound } = await bulkUpdateEmployeeNames(nameUpdates);
      
      let description = `Se actualizaron ${updated} nombres correctamente.`;
      if(notFound.length > 0) {
          description += ` No se encontraron los siguientes nombres: ${notFound.join(', ')}.`;
      }

      toast({
          title: "¡Éxito!",
          description: description,
      });

      if(updated > 0) {
        setTimeout(() => router.push('/dashboard/general'), 1000);
      }
      
    } catch (error) {
       toast({
        title: "Error",
        description: "Ocurrió un error al actualizar los nombres.",
        variant: "destructive",
      });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/general">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-card-foreground">Actualización Masiva de Nombres</h1>
        </div>
      </header>
      <main className="flex-1 p-4">
        <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Personal Actual</CardTitle>
              <CardDescription>Consulta el nombre exacto del personal que deseas actualizar.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px] w-full rounded-md border p-4">
                <ul className="space-y-1">
                  {employees.map(employee => (
                    <li key={employee.id} className="text-sm">{employee.name}</li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Actualizar Nombres</CardTitle>
               <CardDescription>
                Pega la lista de nombres a actualizar. Usa el formato: 
                <code className="font-mono text-sm bg-muted p-1 rounded">Nombre Actual &gt; Nombre Nuevo</code> por cada línea.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nameUpdates">Nombres a Actualizar</Label>
                  <Textarea
                    id="nameUpdates"
                    value={nameUpdates}
                    onChange={(e) => setNameUpdates(e.target.value)}
                    placeholder="Ej:&#10;Juan Pérez > Juan Pérez González&#10;Maria Gonzalez > María de los Ángeles González"
                    required
                    rows={15}
                  />
                </div>
                 <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>¡Importante!</AlertTitle>
                    <AlertDescription>
                        El nombre actual debe coincidir exactamente (mayúsculas y minúsculas no importan). Si un nombre no se encuentra, será ignorado.
                    </AlertDescription>
                </Alert>
                <div className="flex justify-end gap-2">
                   <Link href="/dashboard/general">
                      <Button variant="outline" type="button">
                          Cancelar
                      </Button>
                   </Link>
                  <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Actualizando...' : 'Actualizar Nombres'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
