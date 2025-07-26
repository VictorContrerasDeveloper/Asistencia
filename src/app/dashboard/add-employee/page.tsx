
"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getOffices, addEmployee, Office, EmployeeRole } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";

const ROLES: EmployeeRole[] = ['Modulo', 'Anfitrión', 'Tablet'];

export default function AddEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [role, setRole] = useState<EmployeeRole>('Modulo');
  const [offices, setOffices] = useState<Office[]>([]);

  useEffect(() => {
    const fetchOffices = async () => {
      const fetchedOffices = await getOffices();
      setOffices(fetchedOffices);
    }
    fetchOffices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !officeId || !role) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos.",
        variant: "destructive",
      });
      return;
    }
    await addEmployee(name, officeId, role);
    toast({
        title: "¡Éxito!",
        description: "El ejecutivo ha sido agregado correctamente.",
    });
    router.push('/dashboard/general');
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
          <h1 className="text-xl md:text-2xl font-bold text-card-foreground">Agregar Nuevo Ejecutivo</h1>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Detalles del Ejecutivo</CardTitle>
            <CardDescription>
              Ingresa la información del nuevo ejecutivo y asígnalo a una oficina.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  required
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
              <div className="space-y-2">
                <Label htmlFor="role">Función Asignada</Label>
                <Select value={role} onValueChange={(value) => setRole(value as EmployeeRole)} required>
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Selecciona una función" />
                    </SelectTrigger>
                    <SelectContent>
                        {ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                                {role}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                 <Link href="/dashboard/general">
                    <Button variant="outline">
                        Cancelar
                    </Button>
                 </Link>
                <Button type="submit">
                    Guardar Ejecutivo
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
