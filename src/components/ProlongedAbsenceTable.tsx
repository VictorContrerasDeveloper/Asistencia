
"use client";

import { useMemo, useState, useCallback, forwardRef } from 'react';
import { type Employee, type Office, updateEmployee } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { CalendarIcon, UserCheck } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { formatInTimeZone } from 'date-fns-tz';

type ProlongedAbsenceTableProps = {
  employees: Employee[];
  offices: Office[];
  onEmployeeReinstated: (employeeId: string) => void;
};

const PROLONGED_ABSENCE_REASONS: (string | null)[] = ['Licencia médica', 'Vacaciones', 'Otro'];

const ProlongedAbsenceTable = ({ employees, offices, onEmployeeReinstated }: ProlongedAbsenceTableProps) => {
    const { toast } = useToast();
    
    const officeMap = useMemo(() => {
      return new Map(offices.map(office => [office.id, office.name]));
    }, [offices]);
      
    const absentEmployees = useMemo(() => {
      const displayedOfficeIds = new Set(offices.map(o => o.id));

      return employees
        .filter(emp => 
          emp.status === 'Ausente' && 
          PROLONGED_ABSENCE_REASONS.includes(emp.absenceReason) &&
          displayedOfficeIds.has(emp.officeId)
        )
        .map(emp => ({
          ...emp,
          officeName: officeMap.get(emp.officeId) || 'Sin asignar'
        }))
        .sort((a, b) => {
          if (a.absenceEndDate && b.absenceEndDate) {
              return new Date(a.absenceEndDate).getTime() - new Date(b.absenceEndDate).getTime();
          }
          if (a.absenceEndDate) return -1;
          if (b.absenceEndDate) return 1;
          return a.name.localeCompare(b.name);
        });
    }, [employees, offices, officeMap]);
    
    const handleDateChange = async (employeeId: string, date: Date | undefined) => {
      if (!date) return;
      
      const newEndDate = formatInTimeZone(date, 'UTC', 'yyyy-MM-dd');
      
      try {
          await updateEmployee(employeeId, { absenceEndDate: newEndDate });
          toast({
            title: 'Fecha actualizada',
            description: 'La fecha de término de la ausencia ha sido guardada.',
          })
      } catch(e) {
          toast({
              title: "Error",
              description: "No se pudo guardar la fecha.",
              variant: "destructive"
          })
      }
    }

    const handleReinstate = async (employeeId: string) => {
      try {
        await updateEmployee(employeeId, {
          status: 'Presente',
          absenceReason: null,
          absenceEndDate: null,
        });
        onEmployeeReinstated(employeeId);
        toast({
          title: "¡Éxito!",
          description: "El empleado ha sido reintegrado.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo reintegrar al empleado.",
          variant: "destructive",
        });
      }
    };


    if (absentEmployees.length === 0) {
      return (
          <p className="text-sm text-muted-foreground p-4 text-center">No hay personal con ausencias prolongadas para mostrar.</p>
      )
    }

    return (
      <div className="overflow-x-auto border-t">
        <Table>
          <TableHeader className="bg-primary">
            <TableRow>
              <TableHead className="font-bold text-primary-foreground text-sm px-2 py-1">Nombre</TableHead>
              <TableHead className="font-bold text-primary-foreground text-sm px-2 py-1">Motivo</TableHead>
              <TableHead className="font-bold text-primary-foreground text-sm px-2 py-1">Fecha Término</TableHead>
              <TableHead className="font-bold text-primary-foreground text-sm px-2 py-1">Última Oficina Asignada</TableHead>
              <TableHead className="font-bold text-primary-foreground text-right text-sm px-2 py-1 exclude-from-image">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {absentEmployees.map(employee => {
              const selectedDate = employee.absenceEndDate ? parseISO(employee.absenceEndDate) : undefined;
              return (
                  <TableRow key={employee.id}>
                  <TableCell className="font-medium p-1 text-xs">{employee.name}</TableCell>
                  <TableCell className="p-1 text-xs">{employee.absenceReason}</TableCell>
                  <TableCell className="p-1 text-xs">
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button
                              variant={"outline"}
                              size="sm"
                              className={cn(
                                  "w-[160px] justify-start text-left font-normal h-7 text-xs px-2",
                                  !selectedDate && "text-muted-foreground"
                              )}
                              >
                              <CalendarIcon className="mr-1.5 h-3 w-3" />
                              {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => handleDateChange(employee.id, date)}
                              initialFocus
                              locale={es}
                              />
                          </PopoverContent>
                      </Popover>
                  </TableCell>
                  <TableCell className="p-1 text-xs">{employee.officeName}</TableCell>
                  <TableCell className="p-1 text-right exclude-from-image">
                    <Button variant="ghost" size="sm" onClick={() => handleReinstate(employee.id)} title="Reintegrar empleado" className="h-7 w-7 p-0">
                      <UserCheck className="h-4 w-4 text-green-600" />
                    </Button>
                  </TableCell>
                  </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    );
}


ProlongedAbsenceTable.displayName = "ProlongedAbsenceTable";

export default ProlongedAbsenceTable;
