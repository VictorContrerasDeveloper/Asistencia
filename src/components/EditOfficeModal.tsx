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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { type Employee, type Office } from '@/lib/data';

type EditOfficeModalProps = {
  employee: Employee;
  offices: Office[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeId: string, newOfficeId: string) => void;
};

export default function EditOfficeModal({ employee, offices, isOpen, onClose, onSave }: EditOfficeModalProps) {
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(employee.officeId);

  const handleSave = () => {
    if (selectedOfficeId) {
      onSave(employee.id, selectedOfficeId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Office for {employee.name}</DialogTitle>
          <DialogDescription>
            Select a new commercial office for this employee.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="office-select" className="mb-2 block">
            Office
          </Label>
          <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId}>
            <SelectTrigger id="office-select">
              <SelectValue placeholder="Select an office" />
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
