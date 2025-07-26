
"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getOffices, bulkAddEmployees, Office } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";

export default function BulkAddEmployeesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [names, setNames] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [offices, setOffices] = useState<Office[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchOffices = async () => {
      const fetchedOffices = await getOffices();
      setOffices(fetchedOffices);
    }
    fetchOffices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!names || !officeId) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      await bulkAddEmployees(names, officeId);
      toast({
          title: "¡Éxito!",
          description: "Los ejecutivos han sido agregados correctamente.",
      });
      router.push('/dashboard/general');
    } catch (error) {
       toast({
        title: "Error",
        description: "Ocurrió un error al guardar los ejecutivos.",
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
          <h1 className="text-xl md:text-2xl font-bold text-card-foreground">Carga Masiva de Ejecutivos</h1>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Agregar Múltiples Ejecutivos</CardTitle>
            <CardDescription>
              Pega una lista de nombres (uno por línea) y asígnalos a una oficina.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="names">Nombres de los Ejecutivos</Label>
                <Textarea
                  id="names"
                  value={names}
                  onChange={(e) => setNames(e.target.value)}
                  placeholder="Juan Pérez&#10;María González&#10;Pedro Ramírez"
                  required
                  rows={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="office">Oficina Asignada</Label>
                <Select value={officeId} onValueChange={setOfficeId} required>
                    <SelectTrigger id="office">
                        <SelectValue placeholder="Selecciona una oficina" />
                    </SelectTrigger>
                    <SelectContent>
                        {offices.map((office) => (
                            <SelectItem key={office.id} value={office.id}>
                                {office.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                 <Link href="/dashboard/general">
                    <Button variant="outline" type="button">
                        Cancelar
                    </Button>
                 </Link>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar Ejecutivos'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
