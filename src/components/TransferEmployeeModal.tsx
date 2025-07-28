
"use client";

import { useState, useMemo } from 'react';
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
import { Employee, Office, updateEmployee } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type TransferEmployeeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee;
  offices: Office[];
};

export default function TransferEmployeeModal({ 
    isOpen, 
    onClose, 
    onSuccess, 
    employee, 
    offices 
}: TransferEmployeeModalProps) {
  const { toast } = useToast();
  const [newOfficeId, setNewOfficeId] = useState(employee.officeId);
  const [isSaving, setIsSaving] = useState(false);

  const currentOfficeName = useMemo(() => {
    return offices.find(o => o.id === employee.officeId)?.name || 'N/A';
  }, [employee, offices]);

  const handleSave = async () => {
    if (newOfficeId === employee.officeId) {
        onClose();
        return;
    }
    setIsSaving(true);
    try {
        await updateEmployee(employee.id, { officeId: newOfficeId });
        toast({
            title: "Traslado exitoso",
            description: `${employee.name} ha sido trasladado/a a la nueva oficina.`,
        });
        onSuccess();
    } catch (error) {
        toast({
            title: "Error",
            description: "No se pudo completar el traslado.",
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
          <DialogTitle>Trasladar a {employee.name}</DialogTitle>
          <DialogDescription>
            Selecciona la nueva oficina para este ejecutivo.
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Confirmar Traslado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
