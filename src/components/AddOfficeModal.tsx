
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AddOfficeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
};

export default function AddOfficeModal({ isOpen, onClose, onSave }: AddOfficeModalProps) {
  const [name, setName] = useState('');

  const handleSave = () => {
    onSave(name);
    setName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nueva Oficina</DialogTitle>
          <DialogDescription>
            Ingresa el nombre de la nueva oficina comercial.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="office-name" className="mb-2 block">
            Nombre de la Oficina
          </Label>
          <Input
            id="office-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Of. Com. Santiago Centro"
            required
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar Oficina</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
