
"use client";

import React, { useState, useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { type EmployeeRole, type Office, type Employee, AttendanceStatus, updateOfficeRealStaffing, AbsenceReason, updateEmployee } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users, CalendarDays } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { cn } from '@/lib/utils';


type ManualEntryTableProps = {
  offices: Office[];
  employees: Employee[];
};

const ROLES: EmployeeRole[] = ['Modulo', 'Anfitrión', 'Tablet'];
const PROLONGED_ABSENCE_REASONS: AbsenceReason[] = ['Licencia médica', 'Vacaciones', 'Otro'];

type RealStaffingValues = {
  [officeId: string]: {
    [key in EmployeeRole]?: string;
  };
};

type AttendanceState = {
    [employeeId: string]: AttendanceStatus;
}

type OfficeAttendanceState = {
    [officeId: string]: AttendanceState
}


const ManualEntryTable = forwardRef(({ offices, employees }: ManualEntryTableProps, ref) => {
  const { toast } = useToast();
  const [realStaffing, setRealStaffing] = useState<RealStaffingValues>({});
  const [attendance, setAttendance] = useState<OfficeAttendanceState>({});
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const initialStaffing: RealStaffingValues = {};
    const initialAttendance: OfficeAttendanceState = {};

    offices.forEach(office => {
      initialStaffing[office.id] = {};
      ROLES.forEach(role => {
        const realValue = office.realStaffing?.[role];
        initialStaffing[office.id][role] = realValue !== undefined ? realValue.toString() : '';
      });
      initialAttendance[office.id] = {};
       (employees.filter(e => e.officeId === office.id)).forEach(emp => {
        initialAttendance[office.id][emp.id] = emp.status;
      });
    });
    
    setRealStaffing(initialStaffing);
    setAttendance(initialAttendance);
    inputRefs.current = new Array(offices.length * ROLES.length);
  }, [offices, employees]);

    useImperativeHandle(ref, () => ({
        getSummaryData: () => {
            const summaryData: { [officeId: string]: any } = {};
            offices.forEach(office => {
                const officeAttendance = attendance[office.id] || {};
                const absentEmployeeNames = employees
                    .filter(emp => emp.officeId === office.id && officeAttendance[emp.id] === 'Ausente' && !PROLONGED_ABSENCE_REASONS.includes(emp.absenceReason))
                    .map(emp => emp.name)
                    .join(' / ');

                summaryData[office.id] = {
                    name: office.name,
                    realStaffing: {
                        Modulo: parseInt(realStaffing[office.id]?.Modulo || '0', 10),
                        Anfitrión: parseInt(realStaffing[office.id]?.Anfitrión || '0', 10),
                        Tablet: parseInt(realStaffing[office.id]?.Tablet || '0', 10),
                    },
                    theoreticalStaffing: {
                      Modulo: office.theoreticalStaffing?.Modulo || 0,
                      Anfitrión: office.theoreticalStaffing?.Anfitrión || 0,
                      Tablet: office.theoreticalStaffing?.Tablet || 0,
                    },
                    absent: absentEmployeeNames || "",
                };
            });
            return summaryData;
        }
    }));
  
  const assignedEmployeesByOffice = useMemo(() => {
    const grouped: { [officeId: string]: Employee[] } = {};
    if (employees) {
        employees.forEach(emp => {
            if (!grouped[emp.officeId]) {
                grouped[emp.officeId] = [];
            }
            grouped[emp.officeId].push(emp);
        });
    }
    return grouped;
  }, [employees]);

  const handleAttendanceChange = async (officeId: string, employeeId: string, type: 'Atrasado' | 'Ausente', isChecked: boolean) => {
    const originalAttendanceState = { ...attendance };
    
    let newStatus: AttendanceStatus;
    const currentState = attendance[officeId]?.[employeeId];

    if (isChecked) {
        newStatus = type;
    } else {
        newStatus = 'Presente';
    }

    // Optimistic update
    setAttendance(prev => {
        const newOfficeAttendance = { ...prev[officeId], [employeeId]: newStatus };
        return {
            ...prev,
            [officeId]: newOfficeAttendance
        };
    });
    

    try {
        const updates: Partial<Employee> = { status: newStatus };
         if (newStatus === 'Presente' || newStatus === 'Atrasado') {
          updates.absenceReason = null;
        } else {
          // Default reason when switching to Ausente
          updates.absenceReason = 'Inasistencia';
        }
        await updateEmployee(employeeId, updates);
    } catch (error) {
        // Revert on failure
        setAttendance(originalAttendanceState);
        toast({
            title: "Error",
            description: "No se pudo actualizar el estado del empleado.",
            variant: "destructive"
        });
    }
};


  const handleStaffingChange = (officeId: string, role: EmployeeRole, value: string) => {
    const newStaffing = {
      ...realStaffing,
      [officeId]: {
        ...realStaffing[officeId],
        [role]: value,
      }
    };
    setRealStaffing(newStaffing);
  };
  
  const handleSaveStaffing = async (officeId: string, role: EmployeeRole) => {
    const value = realStaffing[officeId]?.[role];
    const numberValue = value === '' || value === undefined ? 0 : parseInt(value, 10);
    
    if (isNaN(numberValue) || numberValue < 0) {
        return;
    }

    try {
        await updateOfficeRealStaffing(officeId, { [role]: numberValue });
    } catch(error) {
    }
  }

  const getAssignedEmployees = (officeId: string) => {
    return (assignedEmployeesByOffice[officeId] || []).sort((a,b) => a.name.localeCompare(b.name));
  };
  
  const getEmployeeNamesByStatus = (officeId: string, status: AttendanceStatus): React.ReactElement | "-" => {
     const officeAttendance = attendance[officeId] || {};
     const employeeIdsWithStatus = Object.entries(officeAttendance)
        .filter(([, s]) => s === status)
        .map(([id]) => id);

    const filteredEmployees = employees
        .filter(emp => employeeIdsWithStatus.includes(emp.id))
        .filter(emp => {
            if (status === 'Ausente') {
                return !PROLONGED_ABSENCE_REASONS.includes(emp.absenceReason);
            }
            return true;
        });

    const names = filteredEmployees.map(emp => emp.name);

    if(names.length === 0) return "-";
    
    return (
      <span className="inline-flex items-center flex-wrap justify-center">
        {names.map((name, index) => (
          <React.Fragment key={name}>
            <span>{name}</span>
            {index < names.length - 1 && <span className="font-extrabold text-base mx-1">/</span>}
          </React.Fragment>
        ))}
      </span>
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
      if(e.key === 'Enter') {
          e.preventDefault();
          const nextIndex = currentIndex + 1;
          if(nextIndex < inputRefs.current.length) {
              const nextInput = inputRefs.current[nextIndex];
              if(nextInput) {
                  nextInput.focus();
                  nextInput.select();
              }
          }
      }
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-primary text-primary-foreground">
           <TableRow className="border-0 h-auto">
              <TableHead rowSpan={2} className={'sticky left-0 bg-primary border-b-2 border-primary font-bold text-primary-foreground text-center align-middle h-auto p-0 border-r border-primary'}>Oficina Comercial</TableHead>
              {ROLES.map((role) => (
                <TableHead key={role} colSpan={2} className={'text-center font-bold text-primary-foreground border-b-2 border-primary py-0 h-auto p-1 border-r border-primary'}>{role}</TableHead>
              ))}
              <TableHead rowSpan={2} className={'text-center font-bold text-primary-foreground align-middle border-b-2 border-primary py-0 h-auto border-r border-primary'}>Atrasos</TableHead>
              <TableHead rowSpan={2} className={'text-center font-bold text-primary-foreground align-middle border-b-2 border-primary py-0 h-auto'}>Ausentes</TableHead>
          </TableRow>
          <TableRow className="border-0 h-auto">
              {ROLES.map((role, index) => (
                <React.Fragment key={role}>
                    <TableHead className={'text-center font-bold text-primary-foreground border-b-2 border-primary py-0 h-auto w-14 p-1'}>Real</TableHead>
                    <TableHead className={'text-center font-bold text-primary-foreground border-b-2 border-primary py-0 h-auto w-14 p-1 border-r border-primary'}>Teóri.</TableHead>
                </React.Fragment>
              ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {offices.map((office, officeIndex) => {
            const assignedEmployees = getAssignedEmployees(office.id);
            return (
                <TableRow key={office.id}>
                <TableCell className={'font-medium sticky left-0 bg-card p-1 border-r border-primary'}>
                    <div className="flex items-center gap-2">
                        <span>{office.name}</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-6 w-6">
                                    <Users className="h-4 w-4"/>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96">
                                <div className="grid gap-1">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold leading-none">Personal Asignado</p>
                                    </div>
                                    <div className="grid gap-2">
                                        {assignedEmployees.length > 0 ? (
                                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mt-2">
                                            {assignedEmployees.map(emp => {
                                                const hasProlongedAbsence = emp.status === 'Ausente' && PROLONGED_ABSENCE_REASONS.includes(emp.absenceReason);
                                                return (
                                                    <div key={emp.id} className="flex items-center justify-between">
                                                        <Label htmlFor={`attendance-${office.id}-${emp.id}`} className="flex-1 cursor-pointer flex items-center gap-2">
                                                            {hasProlongedAbsence && <CalendarDays className="h-4 w-4 text-muted-foreground" />}
                                                            {emp.name}
                                                        </Label>
                                                        <div className="flex items-center space-x-4">
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`atrasado-${office.id}-${emp.id}`}
                                                                    checked={attendance[office.id]?.[emp.id] === 'Atrasado'}
                                                                    onCheckedChange={(checked) => handleAttendanceChange(office.id, emp.id, 'Atrasado', !!checked)}
                                                                />
                                                                <Label htmlFor={`atrasado-${office.id}-${emp.id}`} className="text-xs">T</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`ausente-${office.id}-${emp.id}`}
                                                                    checked={attendance[office.id]?.[emp.id] === 'Ausente'}
                                                                    onCheckedChange={(checked) => handleAttendanceChange(office.id, emp.id, 'Ausente', !!checked)}
                                                                />
                                                                <Label htmlFor={`ausente-${office.id}-${emp.id}`} className="text-xs">A</Label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        ) : (
                                        <p className="text-sm text-muted-foreground">No hay personal asignado a esta oficina.</p>
                                        )}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </TableCell>
                {ROLES.map((role, roleIndex) => {
                    const refIndex = officeIndex * ROLES.length + roleIndex;
                    const realValue = realStaffing[office.id]?.[role] ?? '';
                    const theoreticalValue = office.theoreticalStaffing?.[role] || 0;
                    const isDeficit = realValue !== '' && Number(realValue) < theoreticalValue;

                    return (
                        <React.Fragment key={role}>
                            <TableCell className="p-0">
                            <Input
                                ref={el => {inputRefs.current[refIndex] = el}}
                                type="number"
                                min="0"
                                placeholder="0"
                                value={realValue}
                                onChange={(e) => handleStaffingChange(office.id, role, e.target.value)}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleKeyDown(e, refIndex)}
                                onBlur={() => handleSaveStaffing(office.id, role)}
                                className={cn(
                                    "h-7 w-12 mx-auto text-center border-0 rounded-md",
                                    isDeficit && "bg-red-600 text-white"
                                )}
                            />
                            </TableCell>
                            <TableCell className="text-center p-1 border-r border-primary text-muted-foreground">{theoreticalValue}</TableCell>
                        </React.Fragment>
                    )
                })}
                 <TableCell className={'text-center text-xs p-1 border-r border-primary'}>
                    {getEmployeeNamesByStatus(office.id, 'Atrasado')}
                  </TableCell>
                  <TableCell className={'text-center text-xs p-1'}>
                    {getEmployeeNamesByStatus(office.id, 'Ausente')}
                  </TableCell>
                </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

ManualEntryTable.displayName = 'ManualEntryTable';
export default ManualEntryTable;
