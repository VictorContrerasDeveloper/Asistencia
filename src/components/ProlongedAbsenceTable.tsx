
"use client";

import { useMemo } from 'react';
import { type Employee, type Office } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';

type ProlongedAbsenceTableProps = {
  employees: Employee[];
  offices: Office[];
};

const PROLONGED_ABSENCE_REASONS: (string | null)[] = ['Licencia médica', 'Vacaciones', 'Otro'];

export default function ProlongedAbsenceTable({ employees, offices }: ProlongedAbsenceTableProps) {
  const officeMap = useMemo(() => {
    return new Map(offices.map(office => [office.id, office.name]));
  }, [offices]);
    
  const absentEmployees = useMemo(() => {
    return employees
      .filter(emp => emp.status === 'Ausente' && PROLONGED_ABSENCE_REASONS.includes(emp.absenceReason))
      .map(emp => ({
        ...emp,
        officeName: officeMap.get(emp.officeId) || 'Sin asignar'
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, officeMap]);

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {absentEmployees.map(employee => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.absenceReason}</TableCell>
                  <TableCell>{employee.officeName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
