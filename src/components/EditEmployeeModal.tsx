
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Employee, updateEmployee, EmployeeRole, EmployeeLevel } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Pencil } from 'lucide-react';

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
  const [newName, setNewName] = useState(employee.name);
  const [newRole, setNewRole] = useState<EmployeeRole>(employee.role);
  const [newLevel, setNewLevel] = useState<EmployeeLevel>(employee.level || 'Nivel Básico');
  const [isSaving, setIsSaving] = useState(false);
  const [isNameEditable, setIsNameEditable] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewName(employee.name);
      setNewRole(employee.role);
      setNewLevel(employee.level || 'Nivel Básico');
      setIsNameEditable(false);
    }
  }, [isOpen, employee]);


  const handleSave = async () => {
    if (newName === employee.name && newRole === employee.role && newLevel === (employee.level || 'Nivel Básico')) {
        onClose();
        return;
    }
    if (!newName.trim()) {
        toast({
            title: "Error",
            description: "El nombre no puede estar vacío.",
            variant: "destructive"
        });
        return;
    }
    setIsSaving(true);
    try {
        const updates: Partial<Employee> = {};
        if (newName !== employee.name) {
            updates.name = newName;
        }
        if (newRole !== employee.role) {
            updates.role = newRole;
        }
        if (newLevel !== (employee.level || 'Nivel Básico')) {
            updates.level = newLevel;
        }

        await updateEmployee(employee.id, updates);
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
            Modifica los datos de este ejecutivo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
           <div className="space-y-2">
             <Label htmlFor="new-name">Nombre</Label>
             <div className="flex items-center gap-2">
                <Input
                    id="new-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nombre del ejecutivo"
                    disabled={!isNameEditable}
                />
                <Button variant="outline" size="icon" onClick={() => setIsNameEditable(true)} className="shrink-0">
                    <Pencil className="h-4 w-4" />
                </Button>
             </div>
           </div>
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
