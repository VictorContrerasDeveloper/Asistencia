
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Employee, updateEmployee, EmployeeRole, EmployeeLevel } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type EditEmployeeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (employee: Employee) => void;
  employee: Employee;
};

const ROLES: EmployeeRole[] = ['Supervisión', 'Modulo', 'Tablet', 'Anfitrión'];
const LEVELS: EmployeeLevel[] = ['Nivel 1', 'Nivel 2', 'Nivel intermedio', 'Nivel Básico'];

export default function EditEmployeeModal({ 
    isOpen, 
    onClose, 
    onSuccess, 
    employee, 
}: EditEmployeeModalProps) {
  const { toast } = useToast();
  const [newRole, setNewRole] = useState<EmployeeRole>(employee.role);
  const [newLevel, setNewLevel] = useState<EmployeeLevel>(employee.level || 'Nivel Básico');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewRole(employee.role);
      setNewLevel(employee.level || 'Nivel Básico');
    }
  }, [isOpen, employee]);


  const handleSave = async () => {
    if (newRole === employee.role && newLevel === employee.level) {
        onClose();
        return;
    }
    setIsSaving(true);
    try {
        const updates: Partial<Employee> = {};
        if (newRole !== employee.role) {
            updates.role = newRole;
        }
        if (newLevel !== employee.level) {
            updates.level = newLevel;
        }

        await updateEmployee(employee.id, updates);
        toast({
            title: "Actualización exitosa",
            description: `${employee.name} ha sido actualizado/a.`,
        });
        onSuccess({ ...employee, ...updates});
    } catch (error) {
        toast({
            title: "Error",
            description: "No se pudo completar la actualización.",
            variant: "destructive"
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar a {employee.name}</DialogTitle>
          <DialogDescription>
            Modifica el rol y/o el nivel para este ejecutivo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
             <Label htmlFor="new-role">Rol</Label>
             <Select value={newRole} onValueChange={(value) => setNewRole(value as EmployeeRole)}>
                <SelectTrigger id="new-role">
                    <SelectValue placeholder="Selecciona un rol" />
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
             <Label htmlFor="new-level">Nivel</Label>
             <Select value={newLevel} onValueChange={(value) => setNewLevel(value as EmployeeLevel)}>
                <SelectTrigger id="new-level">
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Confirmar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
