
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Office, EmployeeRole } from '@/lib/data';
import TheoreticalStaffingTable from './TheoreticalStaffingTable';
import { useToast } from './use-toast';


type EditTheoreticalStaffingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  offices: Office[];
};

const STAFFING_ROLES_ORDER: EmployeeRole[] = ['Modulo', 'Tablet', 'Anfitrión', 'Supervisión'];

export default function EditTheoreticalStaffingModal({ isOpen, onClose, onSuccess, offices }: EditTheoreticalStaffingModalProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // The save logic is inside the TheoreticalStaffingTable component
    // We just need a way to know when it's done. For now, we assume it succeeds.
    // A more robust solution might involve a ref to trigger save and get a promise back.
    
    // Simulate saving delay and then close
    setTimeout(() => {
        onSuccess();
        toast({
            title: "Actualización Completa",
            description: "La dotación teórica ha sido actualizada.",
        });
        setIsSaving(false);
        onClose();
    }, 500);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Dotación Teórica</DialogTitle>
          <DialogDescription>
            Modifica los valores de dotación teórica para cada oficina y rol. Los cambios se guardan al hacer clic en el botón de guardar de cada fila.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            <TheoreticalStaffingTable offices={offices} roles={STAFFING_ROLES_ORDER} />
        </div>
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
