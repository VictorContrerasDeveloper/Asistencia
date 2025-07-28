
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
import { CalendarIcon, PlusCircle, UserCheck } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import AddAbsenceModal from './AddAbsenceModal';
import { formatInTimeZone } from 'date-fns-tz';

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
      .sort((a, b) => {
        if (a.absenceEndDate && b.absenceEndDate) {
            return new Date(a.absenceEndDate).getTime() - new Date(b.absenceEndDate).getTime();
        }
        if (a.absenceEndDate) return -1; // a comes first
        if (b.absenceEndDate) return 1;  // b comes first
        return a.name.localeCompare(b.name); // fallback to name sort
      });
  }, [employees, offices, officeMap]);
  
  const handleDateChange = async (employeeId: string, date: Date | undefined) => {
    if (!date) return;
    
    const newEndDate = formatInTimeZone(date, 'UTC', 'yyyy-MM-dd');
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

  const handleReinstate = async (employeeId: string) => {
    const originalEmployees = [...employees];
    
    // Optimistic update
    const employeeToUpdate = employees.find(e => e.id === employeeId);
    if (employeeToUpdate) {
        // toast removed as requested
    }

    setEmployees(prev => prev.filter(e => e.id !== employeeId));


    try {
      await updateEmployee(employeeId, {
        status: 'Presente',
        absenceReason: null,
        absenceEndDate: '',
      });
    } catch (error) {
      // Revert on failure
      setEmployees(originalEmployees);
      toast({
        title: "Error",
        description: "No se pudo reintegrar al empleado.",
        variant: "destructive",
      });
    }
  };

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
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex-1"></div>
        <CardTitle className="text-base font-semibold text-center flex-1">Ausencias Prolongadas</CardTitle>
        <div className="flex-1 flex justify-end">
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Agregar
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
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
       <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex-1"></div>
        <CardTitle className="text-base font-semibold text-center flex-1">Ausencias Prolongadas</CardTitle>
        <div className="flex-1 flex justify-end">
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Agregar
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto border-t">
          <Table>
            <TableHeader className="bg-primary/10">
              <TableRow>
                <TableHead className="font-bold text-primary text-sm px-2 py-1">Nombre</TableHead>
                <TableHead className="font-bold text-primary text-sm px-2 py-1">Motivo</TableHead>
                <TableHead className="font-bold text-primary text-sm px-2 py-1">Fecha Término</TableHead>
                <TableHead className="font-bold text-primary text-sm px-2 py-1">Última Oficina Asignada</TableHead>
                <TableHead className="font-bold text-primary text-right text-sm px-2 py-1">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {absentEmployees.map(employee => {
                const selectedDate = dates[employee.id] || (employee.absenceEndDate ? parseISO(employee.absenceEndDate) : undefined)
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
                    <TableCell className="p-1 text-right">
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
