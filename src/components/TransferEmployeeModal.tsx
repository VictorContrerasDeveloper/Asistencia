
"use client";

import { useState, useMemo, useEffect } from 'react';
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
import { Employee, Office, updateEmployee, EmployeeRole } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type TransferEmployeeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee;
  offices: Office[];
};

const ROLES: EmployeeRole[] = ['Supervisión', 'Modulo', 'Tablet', 'Anfitrión'];

export default function TransferEmployeeModal({ 
    isOpen, 
    onClose, 
    onSuccess, 
    employee, 
    offices 
}: TransferEmployeeModalProps) {
  const { toast } = useToast();
  const [newOfficeId, setNewOfficeId] = useState(employee.officeId);
  const [newRole, setNewRole] = useState<EmployeeRole>(employee.role);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewOfficeId(employee.officeId);
      setNewRole(employee.role);
    }
  }, [isOpen, employee]);


  const currentOfficeName = useMemo(() => {
    return offices.find(o => o.id === employee.officeId)?.name || 'N/A';
  }, [employee, offices]);

  const handleSave = async () => {
    if (newOfficeId === employee.officeId && newRole === employee.role) {
        onClose();
        return;
    }
    setIsSaving(true);
    try {
        const updates: Partial<Employee> = {};
        if (newOfficeId !== employee.officeId) {
            updates.officeId = newOfficeId;
        }
        if (newRole !== employee.role) {
            updates.role = newRole;
        }

        await updateEmployee(employee.id, updates);
        toast({
            title: "Actualización exitosa",
            description: `${employee.name} ha sido actualizado/a.`,
        });
        onSuccess();
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
          <DialogTitle>Modificar a {employee.name}</DialogTitle>
          <DialogDescription>
            Selecciona la nueva oficina y/o el nuevo rol para este ejecutivo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Oficina Actual</Label>
            <p className="font-semibold px-3 py-2 border rounded-md bg-muted text-muted-foreground">{currentOfficeName}</p>
          </div>
          <div className="space-y-2">
             <Label htmlFor="new-office">Nueva Oficina</Label>
             <Select value={newOfficeId} onValueChange={setNewOfficeId}>
                <SelectTrigger id="new-office">
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
             <Label htmlFor="new-role">Nuevo Rol</Label>
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
