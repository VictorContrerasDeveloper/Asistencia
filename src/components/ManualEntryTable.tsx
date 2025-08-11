
"use client";

import React, { useState, useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { type EmployeeRole, type Office, type Employee, AttendanceStatus, updateOfficeRealStaffing, AbsenceReason, updateEmployee, EmployeeLevel } from '@/lib/data';
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
import { Separator } from './ui/separator';


type ManualEntryTableProps = {
  offices: Office[];
  employees: Employee[];
  onStaffingUpdate: (officeId: string, role: EmployeeRole, value: number) => void;
  onAttendanceChange: (employeeId: string, newStatus: AttendanceStatus) => void;
};

const DISPLAY_ROLES: EmployeeRole[] = ['Modulo', 'Anfitrión', 'Tablet'];
const PROLONGED_ABSENCE_REASONS: AbsenceReason[] = ['Licencia médica', 'Vacaciones', 'Otro'];

type RealStaffingValues = {
  [officeId: string]: {
    [key in EmployeeRole]?: string;
  };
};

const LevelAbbreviations: Record<EmployeeLevel, string> = {
    'Nivel 1': 'Ej1.',
    'Nivel 2': 'Ej2.',
    'Nivel intermedio': 'Int.',
    'Nivel Básico': 'Basic.',
}

const RolePrefixes: Partial<Record<EmployeeRole, string>> = {
    'Supervisión': 'Sup.',
    'Anfitrión': 'Anf.',
    'Tablet': 'Tab.'
};

const ROLE_ORDER: Record<EmployeeRole, number> = {
    'Supervisión': 1,
    'Modulo': 2,
    'Tablet': 3,
    'Anfitrión': 4,
};

const LEVEL_ORDER: Record<EmployeeLevel, number> = {
    'Nivel 2': 1,
    'Nivel intermedio': 2,
    'Nivel 1': 3,
    'Nivel Básico': 4,
};


const ManualEntryTable = forwardRef(({ offices, employees, onStaffingUpdate, onAttendanceChange }: ManualEntryTableProps, ref) => {
  const { toast } = useToast();
  const [realStaffing, setRealStaffing] = useState<RealStaffingValues>({});
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const initialStaffing: RealStaffingValues = {};
    offices.forEach(office => {
      initialStaffing[office.id] = {};
      DISPLAY_ROLES.forEach(role => {
        const realValue = office.realStaffing?.[role];
        initialStaffing[office.id][role] = realValue !== undefined && realValue !== 0 ? realValue.toString() : '';
      });
    });
    setRealStaffing(initialStaffing);
    inputRefs.current = new Array(offices.length * DISPLAY_ROLES.length);
  }, [offices]);


    useImperativeHandle(ref, () => ({
        getSummaryData: () => {
            const summaryData: { [officeId: string]: any } = {};
            offices.forEach(office => {
                const absentEmployeeNames = employees
                    .filter(emp => emp.officeId === office.id && emp.status === 'Ausente' && !PROLONGED_ABSENCE_REASONS.includes(emp.absenceReason))
                    .map(emp => emp.name)
                    .join(' / ');
                
                const prolongedAbsenceNames = employees
                    .filter(emp => emp.officeId === office.id && PROLONGED_ABSENCE_REASONS.includes(emp.absenceReason))
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
                    prolongedAbsences: prolongedAbsenceNames || "",
                };
            });
            return summaryData;
        },
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

  const handleCheckboxChange = (employeeId: string, currentStatus: AttendanceStatus, type: 'Atrasado' | 'Ausente', isChecked: boolean) => {
    let newStatus: AttendanceStatus;

    if (isChecked) {
        newStatus = type;
    } else {
        newStatus = 'Presente';
    }

    if (newStatus !== currentStatus) {
      onAttendanceChange(employeeId, newStatus);
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
        onStaffingUpdate(officeId, role, numberValue);
    } catch(error) {
    }
  }

  const getAssignedEmployees = (officeId: string) => {
     const sorter = (a: Employee, b: Employee) => {
        const roleA = ROLE_ORDER[a.role] || 99;
        const roleB = ROLE_ORDER[b.role] || 99;
        if(roleA !== roleB) return roleA - roleB;
        
        const levelA = LEVEL_ORDER[a.level || 'Nivel Básico'] || 99;
        const levelB = LEVEL_ORDER[b.level || 'Nivel Básico'] || 99;
        if (levelA !== levelB) return levelA - levelB;

        return a.name.localeCompare(b.name);
    };
    return (assignedEmployeesByOffice[officeId] || []).sort(sorter);
  };
  
  const getEmployeeNamesByStatus = (officeId: string, status: AttendanceStatus): React.ReactElement | "-" => {
     const filteredEmployees = employees
        .filter(emp => emp.officeId === officeId && emp.status === status)
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

  const getEmployeeNamesForProlongedAbsence = (officeId: string): React.ReactElement | "-" => {
    const officeEmployees = employees.filter(emp => emp.officeId === officeId);
    const names = officeEmployees
        .filter(emp => PROLONGED_ABSENCE_REASONS.includes(emp.absenceReason))
        .map(emp => emp.name);

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
  };

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

  const getEmployeePrefix = (employee: Employee) => {
      const levelAbbreviation = LevelAbbreviations[employee.level] || 'Basic.';
      const rolePrefix = RolePrefixes[employee.role];
      return rolePrefix ? rolePrefix : levelAbbreviation;
  }

  return (
    <div className="overflow-x-auto border-t">
      <Table>
        <TableHeader className="bg-primary text-primary-foreground">
           <TableRow className="border-0 h-auto">
              <TableHead rowSpan={2} className={'sticky left-0 bg-primary border-b-2 border-primary font-bold text-primary-foreground text-center align-middle h-auto p-1 border-r border-primary'}>Oficina Comercial</TableHead>
              {DISPLAY_ROLES.map((role) => (
                <TableHead key={role} colSpan={2} className={'text-center font-bold text-primary-foreground border-b-2 border-primary py-0 h-auto px-1 border-r border-primary'}>{role}</TableHead>
              ))}
              <TableHead rowSpan={2} className={'text-center font-bold text-primary-foreground align-middle border-b-2 border-primary py-0 h-auto px-1 border-r border-primary whitespace-nowrap'}>Atrasos/Diferidos</TableHead>
              <TableHead rowSpan={2} className={'text-center font-bold text-primary-foreground align-middle border-b-2 border-primary py-0 h-auto px-1 border-r border-primary whitespace-nowrap'}>Ausencia del día</TableHead>
              <TableHead rowSpan={2} className={'text-center font-bold text-primary-foreground align-middle border-b-2 border-primary py-0 h-auto px-1 whitespace-nowrap'}>Ausencias prolongadas</TableHead>
          </TableRow>
          <TableRow className="border-0 h-auto">
              {DISPLAY_ROLES.map((role, index) => (
                <React.Fragment key={role}>
                    <TableHead className={'text-center font-bold text-primary-foreground border-b-2 border-primary py-0 h-auto w-14 px-1'}>Real</TableHead>
                    <TableHead className={'text-center font-bold text-primary-foreground border-b-2 border-primary py-0 h-auto w-14 px-1 border-r border-primary'}>Teóri.</TableHead>
                </React.Fragment>
              ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {offices.map((office, officeIndex) => {
            const assignedEmployees = getAssignedEmployees(office.id);
            const activeEmployees = assignedEmployees.filter(emp => !PROLONGED_ABSENCE_REASONS.includes(emp.absenceReason));
            const prolongedAbsenceEmployees = assignedEmployees.filter(emp => PROLONGED_ABSENCE_REASONS.includes(emp.absenceReason));

            return (
                <TableRow key={office.id}>
                <TableCell className={'font-medium sticky left-0 bg-card p-0 pl-1 border-r border-primary text-sm'}>
                    <div className="flex items-center gap-1">
                        <span>{office.name}</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-5 w-5">
                                    <Users className="h-3 w-3"/>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96">
                                <div className="grid gap-1">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold leading-none">Personal Asignado</p>
                                    </div>
                                    <div className="grid gap-2 mt-2 max-h-80 overflow-y-auto pr-2">
                                        {assignedEmployees.length > 0 ? (
                                        <>
                                            <div className="space-y-3">
                                                {activeEmployees.map(emp => (
                                                    <div key={emp.id} className="flex items-center justify-between">
                                                        <Label htmlFor={`attendance-${office.id}-${emp.id}`} className="flex-1 cursor-pointer flex items-center gap-2">
                                                            <span className="text-muted-foreground font-semibold text-xs w-auto flex-shrink-0">
                                                                {getEmployeePrefix(emp)}
                                                            </span>
                                                            <span className="truncate">{emp.name}</span>
                                                        </Label>
                                                        <div className="flex items-center space-x-4">
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`atrasado-${office.id}-${emp.id}`}
                                                                    checked={emp.status === 'Atrasado'}
                                                                    onCheckedChange={(checked) => handleCheckboxChange(emp.id, emp.status, 'Atrasado', !!checked)}
                                                                />
                                                                <Label htmlFor={`atrasado-${office.id}-${emp.id}`} className="text-xs">Atr</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`ausente-${office.id}-${emp.id}`}
                                                                    checked={emp.status === 'Ausente'}
                                                                    onCheckedChange={(checked) => handleCheckboxChange(emp.id, emp.status, 'Ausente', !!checked)}
                                                                />
                                                                <Label htmlFor={`ausente-${office.id}-${emp.id}`} className="text-xs">Aus</Label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {prolongedAbsenceEmployees.length > 0 && (
                                                <>
                                                    <Separator className="my-2"/>
                                                    <div className='space-y-2'>
                                                        <p className="text-sm font-semibold leading-none text-muted-foreground">Ausencias Prolongadas</p>
                                                        {prolongedAbsenceEmployees.map(emp => (
                                                            <div key={emp.id} className="flex items-center justify-between">
                                                                <Label className="flex-1 flex items-center gap-2 text-muted-foreground italic">
                                                                    <CalendarDays className="h-4 w-4" />
                                                                    <span className="text-muted-foreground font-semibold text-xs w-auto flex-shrink-0">
                                                                        {getEmployeePrefix(emp)}
                                                                    </span>
                                                                    <span className="truncate">{emp.name}</span>
                                                                </Label>
                                                                <p className='text-xs text-muted-foreground italic'>({emp.absenceReason})</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                        ) : (
                                        <p className="text-sm text-muted-foreground">No hay personal asignado a esta oficina.</p>
                                        )}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </TableCell>
                {DISPLAY_ROLES.map((role, roleIndex) => {
                    const refIndex = officeIndex * DISPLAY_ROLES.length + roleIndex;
                    const realValue = realStaffing[office.id]?.[role] ?? '';
                    const theoreticalValue = office.theoreticalStaffing?.[role] || 0;
                    const isDeficit = realValue !== '' && Number(realValue) < theoreticalValue;

                    return (
                        <React.Fragment key={role}>
                            <TableCell className="p-0.5">
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
                                    "h-7 w-12 mx-auto text-center border-0 rounded-md font-bold text-sm",
                                    isDeficit && "bg-red-600 text-white"
                                )}
                            />
                            </TableCell>
                            <TableCell className="text-center p-1 border-r border-primary text-muted-foreground text-sm">{theoreticalValue}</TableCell>
                        </React.Fragment>
                    )
                })}
                 <TableCell className={'text-center text-xs p-1 border-r border-primary'}>
                    {getEmployeeNamesByStatus(office.id, 'Atrasado')}
                  </TableCell>
                  <TableCell className={'text-center text-xs p-1 border-r border-primary'}>
                    {getEmployeeNamesByStatus(office.id, 'Ausente')}
                  </TableCell>
                   <TableCell className={'text-center text-xs p-1 bg-red-100 dark:bg-red-950/30'}>
                    {getEmployeeNamesForProlongedAbsence(office.id)}
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

    