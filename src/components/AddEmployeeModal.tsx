
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getOffices, addEmployee, Office, EmployeeRole, EmployeeLevel } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";

type AddEmployeeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const ROLES: EmployeeRole[] = ['Modulo', 'Anfitrión', 'Tablet', 'Supervisión'];
const LEVELS: EmployeeLevel[] = ['Nivel 1', 'Nivel 2', 'Nivel intermedio', 'Nivel Básico'];


export default function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [role, setRole] = useState<EmployeeRole>('Modulo');
  const [level, setLevel] = useState<EmployeeLevel>('Nivel Básico');
  const [offices, setOffices] = useState<Office[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchOffices = async () => {
        const fetchedOffices = await getOffices();
        setOffices(fetchedOffices);
      }
      fetchOffices();
    }
  }, [isOpen]);

  const resetForm = () => {
    setName('');
    setOfficeId('');
    setRole('Modulo');
    setLevel('Nivel Básico');
  }

  const handleClose = () => {
    resetForm();
    onClose();
  }

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
    setIsSaving(true);
    try {
        await addEmployee(name, officeId, role, level);
        toast({
            title: "Personal Agregado",
            description: `${name} ha sido agregado/a exitosamente.`
        })
        onSuccess();
        handleClose();
    } catch(err) {
        toast({
            title: "Error",
            description: "No se pudo agregar al personal.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Personal</DialogTitle>
          <DialogDescription>
            Ingresa la información del nuevo personal y asígnalo a una oficina.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
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
          <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={handleClose}>
                    Cancelar
              </Button>
            <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Personal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
