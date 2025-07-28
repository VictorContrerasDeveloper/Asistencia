
"use client";

import { useMemo, useState, useCallback } from 'react';
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
import { CalendarIcon, PlusCircle } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import AddAbsenceModal from './AddAbsenceModal';

type ProlongedAbsenceTableProps = {
  employees: Employee[];
  offices: Office[];
};

const PROLONGED_ABSENCE_REASONS: (string | null)[] = ['Licencia médica', 'Vacaciones', 'Otro'];

export default function ProlongedAbsenceTable({ employees: initialEmployees, offices }: ProlongedAbsenceTableProps) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dates, setDates] = useState<{[key: string]: Date | undefined}>({});
  
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
  
  const handleDateChange = async (employeeId: string, date: Date | undefined) => {
    if (!date) return;
    
    const newEndDate = format(date, 'yyyy-MM-dd');
    setDates(prev => ({...prev, [employeeId]: date}));

    try {
        await updateEmployee(employeeId, { absenceEndDate: newEndDate });
    } catch(e) {
        toast({
            title: "Error",
            description: "No se pudo guardar la fecha.",
            variant: "destructive"
        })
    }
  }

  const handleAbsenceAdded = useCallback((updatedEmployee: Employee) => {
    setEmployees(prevEmployees => {
      const existingEmployeeIndex = prevEmployees.findIndex(e => e.id === updatedEmployee.id);
      if (existingEmployeeIndex !== -1) {
        const newEmployees = [...prevEmployees];
        newEmployees[existingEmployeeIndex] = updatedEmployee;
        return newEmployees;
      }
      return [...prevEmployees, updatedEmployee];
    });
    setIsModalOpen(false);
  }, []);

  if (absentEmployees.length === 0 && !isModalOpen) {
    return (
     <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ejecutivas NO presentes en oficina (Licencias / Vacaciones)</CardTitle>
        <Button onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Ausencia
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground p-4 text-center">No hay personal con ausencias prolongadas para mostrar.</p>
        <AddAbsenceModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAbsenceAdded={handleAbsenceAdded}
            allEmployees={employees}
        />
      </CardContent>
    </Card>
    )
  }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ejecutivas NO presentes en oficina (Licencias / Vacaciones)</CardTitle>
        <Button onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Ausencia
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader className="bg-primary/10">
              <TableRow>
                <TableHead className="font-bold text-primary">Nombre</TableHead>
                <TableHead className="font-bold text-primary">Motivo</TableHead>
                <TableHead className="font-bold text-primary">Fecha Término</TableHead>
                <TableHead className="font-bold text-primary">Última Oficina Asignada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {absentEmployees.map(employee => {
                const selectedDate = dates[employee.id] || (employee.absenceEndDate ? new Date(employee.absenceEndDate) : undefined)
                return (
                    <TableRow key={employee.id}>
                    <TableCell className="font-medium p-2">{employee.name}</TableCell>
                    <TableCell className="p-2">{employee.absenceReason}</TableCell>
                    <TableCell className="p-2">
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
                    <TableCell className="p-2">{employee.officeName}</TableCell>
                    </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    <AddAbsenceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAbsenceAdded={handleAbsenceAdded}
        allEmployees={employees}
    />
    </>
  );
}
