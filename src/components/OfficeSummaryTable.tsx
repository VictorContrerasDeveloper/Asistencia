
"use client";

import { useMemo } from 'react';
import { type Employee, type EmployeeRole, type Office } from '@/lib/data';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ejecutivas SI presentes en oficina</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card border-r-2">Oficina Comercial</TableHead>
                {roles.map(role => (
                  <TableHead key={role} colSpan={2} className="text-center border-r-2 border-muted-foreground">{role}</TableHead>
                ))}
                <TableHead className="text-center">Atrasos</TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="sticky left-0 bg-card border-r-2"></TableHead>
                {roles.map(role => (
                  <React.Fragment key={role}>
                    <TableHead className="text-center">Real</TableHead>
                    <TableHead className="text-center border-r-2 border-muted-foreground">Por Licit</TableHead>
                  </React.Fragment>
                ))}
                 <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offices.map(office => {
                const lateEmployees = getLateEmployees(office.employees);
                return (
                  <TableRow key={office.id}>
                    <TableCell className="font-medium sticky left-0 bg-card border-r-2">{office.name}</TableCell>
                    {roles.map(role => {
                      const realCount = getRoleSummary(office.employees, role);
                      const theoreticalCount = office.theoreticalStaffing?.[role] || 0;
                      const isDeficit = realCount < theoreticalCount;
                      return (
                        <React.Fragment key={role}>
                          <TableCell className={cn("text-center font-bold", isDeficit ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800")}>
                            {realCount}
                          </TableCell>
                          <TableCell className="text-center border-r-2 border-muted-foreground">{theoreticalCount}</TableCell>
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
