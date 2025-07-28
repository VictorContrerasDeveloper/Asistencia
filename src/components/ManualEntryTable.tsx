"use client";

import { useState, useEffect, useMemo } from 'react';
import { type EmployeeRole, type Office, type Employee, AttendanceStatus } from '@/lib/data';
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
import { Users } from 'lucide-react';
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

type ManualEntryTableProps = {
  offices: Office[];
  employees: Employee[];
};

const ROLES: EmployeeRole[] = ['Modulo', 'Anfitrión', 'Tablet'];

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


export default function ManualEntryTable({ offices, employees }: ManualEntryTableProps) {
  const { toast } = useToast();
  const [realStaffing, setRealStaffing] = useState<RealStaffingValues>({});
  const [attendance, setAttendance] = useState<OfficeAttendanceState>({});

  useEffect(() => {
    const initialStaffing: RealStaffingValues = {};
    const initialAttendance: OfficeAttendanceState = {};

    offices.forEach(office => {
      initialStaffing[office.id] = {};
      ROLES.forEach(role => {
        initialStaffing[office.id][role] = office.realStaffing?.[role]?.toString() || '';
      });
      initialAttendance[office.id] = {};
    });

    setRealStaffing(initialStaffing);
    setAttendance(initialAttendance);
  }, [offices]);
  
  const assignedEmployeesByOffice = useMemo(() => {
    const grouped: { [officeId: string]: Employee[] } = {};
    if (employees) {
        for (const emp of employees) {
            if (!grouped[emp.officeId]) {
                grouped[emp.officeId] = [];
            }
            grouped[emp.officeId].push(emp);
        }
    }
    return grouped;
  }, [employees]);

  const handleAttendanceChange = (officeId: string, employeeId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({
        ...prev,
        [officeId]: {
            ...prev[officeId],
            [employeeId]: status,
        }
    }));
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
  
  const getAssignedEmployees = (officeId: string) => {
    return (assignedEmployeesByOffice[officeId] || []).sort((a,b) => a.name.localeCompare(b.name));
  };
  
  const getEmployeeNamesByStatus = (officeId: string, status: AttendanceStatus) => {
     const employeeIds = Object.entries(attendance[officeId] || {})
        .filter(([, s]) => s === status)
        .map(([id]) => id);
    
    if(employeeIds.length === 0) return "-";

    return employees
        .filter(emp => employeeIds.includes(emp.id))
        .map(emp => emp.name)
        .join(', ');
  }


  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-card border-r-2 border-muted-foreground font-bold text-primary">Oficina Comercial</TableHead>
            {ROLES.map(role => (
              <TableHead key={role} colSpan={2} className="text-center border-r-2 border-muted-foreground font-bold text-primary">{role}</TableHead>
            ))}
            <TableHead className="text-center font-bold text-primary">Personal Ausente</TableHead>
            <TableHead className="text-center font-bold text-primary">Atrasos</TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="sticky left-0 bg-card border-r-2 border-muted-foreground"></TableHead>
            {ROLES.map(role => (
              <React.Fragment key={`${role}-sub`}>
                <TableHead className="text-center font-bold text-primary">Real</TableHead>
                <TableHead className="text-center border-r-2 border-muted-foreground font-bold text-primary">Teori.</TableHead>
              </React.Fragment>
            ))}
            <TableHead></TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offices.map(office => {
            const assignedEmployees = getAssignedEmployees(office.id);
            return (
                <TableRow key={office.id}>
                <TableCell className="font-medium sticky left-0 bg-card border-r-2 border-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span>{office.name}</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7">
                                    <Users className="h-4 w-4"/>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96">
                                <div className="grid gap-1">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold leading-none">Personal Asignado</p>
                                        <p className="text-xs text-muted-foreground">
                                            Selecciona el estado de asistencia de cada ejecutivo.
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        {assignedEmployees.length > 0 ? (
                                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mt-2">
                                            {assignedEmployees.map(emp => (
                                            <div key={emp.id} className="flex items-center justify-between">
                                                <Label htmlFor={`attendance-${office.id}-${emp.id}`} className="flex-1 cursor-pointer">{emp.name}</Label>
                                                 <RadioGroup
                                                    id={`attendance-${office.id}-${emp.id}`}
                                                    value={attendance[office.id]?.[emp.id] || 'Presente'}
                                                    onValueChange={(value) => handleAttendanceChange(office.id, emp.id, value as AttendanceStatus)}
                                                    className="flex items-center space-x-2"
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        <RadioGroupItem value="Presente" id={`presente-${office.id}-${emp.id}`} />
                                                        <Label htmlFor={`presente-${office.id}-${emp.id}`} className="text-xs">P</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <RadioGroupItem value="Atrasado" id={`atrasado-${office.id}-${emp.id}`} />
                                                        <Label htmlFor={`atrasado-${office.id}-${emp.id}`} className="text-xs">T</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <RadioGroupItem value="Ausente" id={`ausente-${office.id}-${emp.id}`} />
                                                        <Label htmlFor={`ausente-${office.id}-${emp.id}`} className="text-xs">A</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                            ))}
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
                {ROLES.map(role => (
                    <React.Fragment key={role}>
                        <TableCell>
                        <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={realStaffing[office.id]?.[role] || ''}
                            onChange={(e) => handleStaffingChange(office.id, role, e.target.value)}
                            className="h-8 w-20 mx-auto text-center"
                        />
                        </TableCell>
                        <TableCell className="text-center border-r-2 border-muted-foreground">{office.theoreticalStaffing?.[role] || 0}</TableCell>
                    </React.Fragment>
                ))}
                 <TableCell className="text-center text-xs">
                    {getEmployeeNamesByStatus(office.id, 'Ausente')}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    {getEmployeeNamesByStatus(office.id, 'Atrasado')}
                  </TableCell>
                </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
