
"use client";

import { useMemo } from 'react';
import { type Employee } from '@/lib/data';
import { Users, UserCheck, UserX, Stethoscope } from 'lucide-react';

type Summary = {
  total: number;
  present: number;
  absent: number;
  license: number;
};

export default function OfficeAttendanceSummary({ employees }: { employees: Employee[] }) {

  const summary = useMemo<Summary>(() => {
    return {
      total: employees.length,
      present: employees.filter(emp => emp.status === 'Presente').length,
      absent: employees.filter(emp => emp.status === 'Ausente' && (emp.absenceReason === 'Inasistencia' || emp.absenceReason === 'Otro')).length,
      license: employees.filter(emp => emp.absenceReason === 'Licencia médica' || emp.absenceReason === 'Vacaciones').length,
    };
  }, [employees]);

  if (employees.length === 0) {
      return null;
  }

  return (
    <div className="hidden md:flex items-center gap-4 border-l pl-4 ml-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Total:</span>
            <span className="font-bold text-foreground">{summary.total}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-700">
            <UserCheck className="h-4 w-4" />
            <span>Presentes:</span>
            <span className="font-bold">{summary.present}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-700">
            <UserX className="h-4 w-4" />
            <span>Ausentes:</span>
            <span className="font-bold">{summary.absent}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-yellow-700">
            <Stethoscope className="h-4 w-4" />
            <span>Lic/Vac:</span>
            <span className="font-bold">{summary.license}</span>
        </div>
    </div>
  );
}
