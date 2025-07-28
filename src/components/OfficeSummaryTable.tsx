
"use client";

import { useMemo } from 'react';
import { type Employee, type EmployeeRole } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { cn } from '@/lib/utils';
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Users } from 'lucide-react';
import { Button } from './ui/button';

type OfficeSummary = {
  id: string;
  name: string;
  employees: Employee[];
  theoreticalStaffing?: {
    [key in EmployeeRole]?: number;
  };
};

type OfficeSummaryTableProps = {
  offices: OfficeSummary[];
  roles: EmployeeRole[];
};

export default function OfficeSummaryTable({ offices, roles }: OfficeSummaryTableProps) {
    
  const getRoleSummary = (employees: Employee[], role: EmployeeRole) => {
    return employees.filter(e => e.role === role && (e.status === 'Presente' || e.status === 'Atrasado')).length;
  };

  const getLateEmployees = (employees: Employee[]) => {
    return employees.filter(e => e.status === 'Atrasado').map(e => e.name).join(', ');
  };
  
  const filteredOffices = useMemo(() => {
      return offices.filter(office => !office.name.toLowerCase().includes('movil'));
  }, [offices]);

  const tableHeadClasses = "py-1 px-2";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ejecutivas SI presentes en oficina</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-primary text-primary-foreground">
               <TableRow>
                  <TableHead rowSpan={2} className={`sticky left-0 bg-primary border-r-2 border-muted-foreground font-bold text-primary-foreground text-center align-middle ${tableHeadClasses}`}>Oficina Comercial</TableHead>
                  {roles.map(role => (
                    <TableHead key={role} colSpan={2} className={`text-center font-bold text-primary-foreground p-1 ${tableHeadClasses}`}>{role}</TableHead>
                  ))}
                  <TableHead rowSpan={2} className={`text-center font-bold text-primary-foreground align-middle ${tableHeadClasses}`}>Atrasos</TableHead>
              </TableRow>
              <TableRow>
                  {roles.map(role => (
                    <React.Fragment key={role}>
                      <TableHead className={`text-center font-bold text-primary-foreground ${tableHeadClasses}`}>Real</TableHead>
                      <TableHead className={`text-center font-bold text-primary-foreground ${tableHeadClasses}`}>Por Licit</TableHead>
                    </React.Fragment>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOffices.map(office => {
                const lateEmployees = getLateEmployees(office.employees);
                return (
                  <TableRow key={office.id}>
                    <TableCell className="font-medium sticky left-0 bg-card border-r-2 border-muted-foreground">
                       <div className="flex items-center gap-2">
                        <span>{office.name}</span>
                        <Popover>
                            <PopoverTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-6 w-6">
                                 <Users className="h-4 w-4 text-muted-foreground" />
                               </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                               <div className="grid gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Personal Asignado</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Lista de ejecutivos en la oficina {office.name}.
                                    </p>
                                  </div>
                                  <div className="grid gap-2">
                                      {office.employees.length > 0 ? (
                                        <ul className="list-disc list-inside text-sm max-h-48 overflow-y-auto">
                                          {office.employees.map(emp => (
                                            <li key={emp.id}>{emp.name}</li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">No hay personal asignado a esta oficina.</p>
                                      )}
                                  </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                       </div>
                    </TableCell>
                    {roles.map(role => {
                      const realCount = getRoleSummary(office.employees, role);
                      const theoreticalCount = office.theoreticalStaffing?.[role] || 0;
                      const isDeficit = realCount < theoreticalCount;
                      return (
                        <React.Fragment key={role}>
                          <TableCell className={cn("text-center font-bold", isDeficit ? "bg-red-600 text-white" : "")}>
                            {realCount}
                          </TableCell>
                          <TableCell className="text-center">{theoreticalCount}</TableCell>
                        </React.Fragment>
                      );
                    })}
                    <TableCell className="text-center">{lateEmployees || '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
