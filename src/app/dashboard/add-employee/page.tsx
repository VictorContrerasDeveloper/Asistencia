
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
import { getOffices, addEmployee, Office, EmployeeRole, EmployeeLevel } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";

const ROLES: EmployeeRole[] = ['Modulo', 'Anfitrión', 'Tablet', 'Supervisión'];
const LEVELS: EmployeeLevel[] = ['Nivel 1', 'Nivel 2', 'Nivel intermedio', 'Nivel Básico'];


export default function AddEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [role, setRole] = useState<EmployeeRole>('Modulo');
  const [level, setLevel] = useState<EmployeeLevel>('Nivel Básico');
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
    if (!name || !officeId || !role || !level) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos.",
        variant: "destructive",
      });
      return;
    }
    await addEmployee(name, officeId, role, level);
    router.push('/dashboard/general');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
       <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/dashboard/general">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-card-foreground">Agregar Nuevo Personal</h1>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Detalles del Personal</CardTitle>
            <CardDescription>
              Ingresa la información del nuevo personal y asígnalo a una oficina.
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
              <div className="space-y-2">
                <Label htmlFor="level">Nivel</Label>
                <Select value={level} onValueChange={(value) => setLevel(value as EmployeeLevel)} required>
                    <SelectTrigger id="level">
                        <SelectValue placeholder="Selecciona un nivel" />
                    </SelectTrigger>
                    <SelectContent>
                        {LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                                {level}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                 <Button asChild variant="outline">
                    <Link href="/dashboard/general">
                        Cancelar
                    </Link>
                 </Button>
                <Button type="submit">
                    Guardar Personal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
