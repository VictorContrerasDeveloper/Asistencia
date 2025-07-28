
"use client";

import { useMemo, useState } from 'react';
import { type Employee, type Office, updateEmployee } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type ProlongedAbsenceTableProps = {
  employees: Employee[];
  offices: Office[];
};

const PROLONGED_ABSENCE_REASONS: (string | null)[] = ['Licencia médica', 'Vacaciones', 'Otro'];

export default function ProlongedAbsenceTable({ employees, offices }: ProlongedAbsenceTableProps) {
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
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, offices, officeMap]);
  
  const [dates, setDates] = useState<{[key: string]: Date | undefined}>({});

  const handleDateChange = async (employeeId: string, date: Date | undefined) => {
    if (!date) return;
    
    const newEndDate = format(date, 'yyyy-MM-dd');
    setDates(prev => ({...prev, [employeeId]: date}));

    try {
        await updateEmployee(employeeId, { absenceEndDate: newEndDate });
        toast({
            title: "Fecha actualizada",
            description: "La fecha de término de ausencia ha sido guardada.",
        })
    } catch(e) {
        toast({
            title: "Error",
            description: "No se pudo guardar la fecha.",
            variant: "destructive"
        })
    }
  }

  if (absentEmployees.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ejecutivas NO presentes en oficina (Licencias / Vacaciones)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader className="bg-primary/10">
              <TableRow>
                <TableHead className="font-bold text-primary">Nombre</TableHead>
                <TableHead className="font-bold text-primary">Motivo</TableHead>
                <TableHead className="font-bold text-primary">Última Oficina Asignada</TableHead>
                <TableHead className="font-bold text-primary">Fecha Término</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {absentEmployees.map(employee => {
                const selectedDate = dates[employee.id] || (employee.absenceEndDate ? new Date(employee.absenceEndDate) : undefined)
                return (
                    <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.absenceReason}</TableCell>
                    <TableCell>{employee.officeName}</TableCell>
                    <TableCell>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal",
                                    !selectedDate && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
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
                    </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
