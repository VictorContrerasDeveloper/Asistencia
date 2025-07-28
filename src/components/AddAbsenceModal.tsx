
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from './ui/calendar';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { Employee, AbsenceReason, updateEmployee } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatInTimeZone } from 'date-fns-tz';

type AddAbsenceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAbsenceAdded: (employee: Employee) => void;
  allEmployees: Employee[];
};

const ABSENCE_REASONS: Exclude<AbsenceReason, null | 'Inasistencia'>[] = ['Licencia médica', 'Vacaciones', 'Otro'];

export default function AddAbsenceModal({ isOpen, onClose, onAbsenceAdded, allEmployees }: AddAbsenceModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [reason, setReason] = useState<string>('');
  const [endDate, setEndDate] = useState<Date | undefined>();

  const sortedEmployees = useMemo(() => {
      return [...allEmployees].sort((a,b) => a.name.localeCompare(b.name));
  }, [allEmployees])

  const handleSave = async () => {
    if (!selectedEmployee || !reason) {
        toast({
            title: "Error",
            description: "Por favor, selecciona un ejecutivo y un motivo.",
            variant: "destructive"
        });
        return;
    }

    try {
        const updates: Partial<Employee> = {
            status: 'Ausente',
            absenceReason: reason as AbsenceReason,
            absenceEndDate: endDate ? formatInTimeZone(endDate, 'UTC', 'yyyy-MM-dd') : undefined,
        };
        await updateEmployee(selectedEmployee.id, updates);
        
        onAbsenceAdded({ ...selectedEmployee, ...updates });
        resetForm();
    } catch (error) {
         toast({
            title: "Error",
            description: "No se pudo registrar la ausencia.",
            variant: "destructive"
        });
    }
  };

  const resetForm = () => {
      setSelectedEmployee(null);
      setReason('');
      setEndDate(undefined);
  }
  
  const handleClose = () => {
      resetForm();
      onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Ausencia Prolongada</DialogTitle>
          <DialogDescription>
            Busca un ejecutivo y registra su ausencia por licencia, vacaciones u otro motivo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Ejecutivo</Label>
             <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    >
                    {selectedEmployee
                        ? selectedEmployee.name
                        : "Seleccionar ejecutivo..."}
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
                                setOpen(false)
                            }}
                            >
                            <Check
                                className={cn(
                                "mr-2 h-4 w-4",
                                selectedEmployee?.id === employee.id ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {employee.name}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
             <Label htmlFor="absence-reason">Motivo</Label>
             <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="absence-reason">
                    <SelectValue placeholder="Selecciona un motivo" />
                </SelectTrigger>
                <SelectContent>
                    {ABSENCE_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>
                            {r}
                        </SelectItem>
                    ))}
                </SelectContent>
             </Select>
          </div>
           <div className="space-y-2">
             <Label htmlFor="absence-endDate">Fecha de Término (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    locale={es}
                    />
                </PopoverContent>
            </Popover>
           </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar Ausencia</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
