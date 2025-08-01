
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
import { Calendar } from '@/components/ui/calendar';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

type SaveDayModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: Date) => Promise<void>;
  isSaving: boolean;
};

export default function SaveDayModal({ isOpen, onClose, onSave, isSaving }: SaveDayModalProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleSave = () => {
    if (!selectedDate) {
      toast({
        title: "Error de Validación",
        description: "Por favor, selecciona una fecha para guardar el reporte.",
        variant: "destructive",
      });
      return;
    }
    onSave(selectedDate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Seleccionar Fecha del Reporte</DialogTitle>
          <DialogDescription>
            Elige la fecha para la cual deseas guardar el resumen diario. Por defecto, se usa la fecha actual.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex justify-center">
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={es}
                disabled={isSaving}
            />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !selectedDate}>
            {isSaving ? 'Guardando...' : 'Guardar Reporte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
