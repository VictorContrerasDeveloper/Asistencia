"use client";

import { useState, useEffect, useMemo } from 'react';
import { type EmployeeRole, type Office, type Employee } from '@/lib/data';
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
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

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

export default function ManualEntryTable({ offices, employees }: ManualEntryTableProps) {
  const { toast } = useToast();
  const [realStaffing, setRealStaffing] = useState<RealStaffingValues>({});
  const [absentEmployees, setAbsentEmployees] = useState<{ [officeId: string]: string[] }>({});

  useEffect(() => {
    const initialStaffing: RealStaffingValues = {};
    const initialAbsences: { [officeId: string]: string[] } = {};

    offices.forEach(office => {
      initialStaffing[office.id] = {};
      ROLES.forEach(role => {
        initialStaffing[office.id][role] = office.realStaffing?.[role]?.toString() || '';
      });
      initialAbsences[office.id] = [];
    });

    setRealStaffing(initialStaffing);
    setAbsentEmployees(initialAbsences);
  }, [offices]);
  
  const assignedEmployeesByOffice = useMemo(() => {
    const grouped: { [officeId: string]: Employee[] } = {};
    for (const emp of employees) {
      if (!grouped[emp.officeId]) {
        grouped[emp.officeId] = [];
      }
      grouped[emp.officeId].push(emp);
    }
    return grouped;
  }, [employees]);

  const handleAbsentChange = (officeId: string, employeeId: string, isChecked: boolean) => {
    setAbsentEmployees(prev => {
      const currentAbsences = prev[officeId] || [];
      let newAbsences;
      if (isChecked) {
        newAbsences = [...currentAbsences, employeeId];
      } else {
        newAbsences = currentAbsences.filter(id => id !== employeeId);
      }
      return { ...prev, [officeId]: newAbsences };
    });
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
    return employees.filter(emp => emp.officeId === officeId).sort((a,b) => a.name.localeCompare(b.name));
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-card border-r-2 border-muted-foreground font-bold text-primary">Oficina Comercial</TableHead>
            {ROLES.map(role => (
              <TableHead key={role} colSpan={2} className="text-center border-r-2 border-muted-foreground font-bold text-primary">{role}</TableHead>
            ))}
          </TableRow>
          <TableRow>
            <TableHead className="sticky left-0 bg-card border-r-2 border-muted-foreground"></TableHead>
            {ROLES.map(role => (
              <React.Fragment key={`${role}-sub`}>
                <TableHead className="text-center font-bold text-primary">Real</TableHead>
                <TableHead className="text-center border-r-2 border-muted-foreground font-bold text-primary">Teori.</TableHead>
              </React.Fragment>
            ))}
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
                                <Button size="sm" variant="outline" className="h-8">
                                    <Users className="h-4 w-4 mr-2"/>
                                    Ver Personal
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="grid gap-1">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold leading-none">Personal Asignado</p>
                                        <p className="text-xs text-muted-foreground">
                                            Marca el personal ausente en {office.name}.
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        {assignedEmployees.length > 0 ? (
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                            {assignedEmployees.map(emp => (
                                            <div key={emp.id} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={`absent-${office.id}-${emp.id}`}
                                                    checked={(absentEmployees[office.id] || []).includes(emp.id)}
                                                    onCheckedChange={(checked) => handleAbsentChange(office.id, emp.id, !!checked)}
                                                />
                                                <Label htmlFor={`absent-${office.id}-${emp.id}`} className="flex-1 cursor-pointer">{emp.name}</Label>
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
                </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
