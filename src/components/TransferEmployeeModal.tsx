
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Employee, Office, updateEmployee } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type TransferEmployeeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onEmployeeTransferred: (employee: Employee) => void;
  allEmployees: Employee[];
  allOffices: Office[];
};

export default function TransferEmployeeModal({ isOpen, onClose, onEmployeeTransferred, allEmployees, allOffices }: TransferEmployeeModalProps) {
  const { toast } = useToast();
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [targetOfficeId, setTargetOfficeId] = useState<string>('');

  useEffect(() => {
    if (selectedEmployee) {
      setTargetOfficeId('');
    }
  }, [selectedEmployee]);

  const sortedEmployees = useMemo(() => {
      return [...allEmployees].sort((a,b) => a.name.localeCompare(b.name));
  }, [allEmployees]);
  
  const sortedOffices = useMemo(() => {
    return [...allOffices].sort((a,b) => a.name.localeCompare(b.name));
  }, [allOffices]);

  const handleSave = async () => {
    if (!selectedEmployee || !targetOfficeId) {
        toast({
            title: "Error",
            description: "Por favor, selecciona un ejecutivo y una oficina de destino.",
            variant: "destructive"
        });
        return;
    }

    if (selectedEmployee.officeId === targetOfficeId) {
        toast({
            title: "Error",
            description: "El ejecutivo ya se encuentra en esa oficina.",
            variant: "destructive"
        });
        return;
    }

    try {
        const updates: Partial<Employee> = {
            officeId: targetOfficeId,
        };
        await updateEmployee(selectedEmployee.id, updates);
        
        onEmployeeTransferred({ ...selectedEmployee, ...updates });
        resetForm();
        onClose();
    } catch (error) {
         toast({
            title: "Error",
            description: "No se pudo trasladar al ejecutivo.",
            variant: "destructive"
        });
    }
  };

  const resetForm = () => {
      setSelectedEmployee(null);
      setTargetOfficeId('');
  }
  
  const handleClose = () => {
      resetForm();
      onClose();
  }
  
  const getOfficeName = (officeId: string) => {
    return allOffices.find(o => o.id === officeId)?.name || 'N/A';
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trasladar Personal</DialogTitle>
          <DialogDescription>
            Selecciona un ejecutivo y la nueva oficina a la que será asignado.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Ejecutivo</Label>
             <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between"
                    >
                    <span className='truncate'>
                    {selectedEmployee
                        ? `${selectedEmployee.name} (Actual: ${getOfficeName(selectedEmployee.officeId)})`
                        : "Seleccionar ejecutivo..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                    <CommandInput placeholder="Buscar ejecutivo..." />
                    <CommandList>
                        <CommandEmpty>No se encontró el ejecutivo.</CommandEmpty>
                        <CommandGroup>
                        {sortedEmployees.map((employee) => (
                            <CommandItem
                            key={employee.id}
                            value={employee.name}
                            onSelect={() => {
                                setSelectedEmployee(employee)
                                setOpenCombobox(false)
                            }}
                            >
                            <Check
                                className={cn(
                                "mr-2 h-4 w-4",
                                selectedEmployee?.id === employee.id ? "opacity-100" : "opacity-0"
                                )}
                            />
                             <span className='truncate'>{employee.name}</span>
                             <span className='ml-2 text-xs text-muted-foreground truncate'>({getOfficeName(employee.officeId)})</span>
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
          </div>
          {selectedEmployee && (
            <div className="space-y-2">
                <Label htmlFor="target-office">Nueva Oficina</Label>
                <Select value={targetOfficeId} onValueChange={setTargetOfficeId}>
                    <SelectTrigger id="target-office">
                        <SelectValue placeholder="Selecciona una oficina de destino" />
                    </SelectTrigger>
                    <SelectContent>
                        {sortedOffices
                            .filter(office => office.id !== selectedEmployee.officeId)
                            .map((office) => (
                            <SelectItem key={office.id} value={office.id}>
                                {office.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave}>Confirmar Traslado</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

