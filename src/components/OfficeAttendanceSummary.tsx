
"use client";

import { useMemo } from 'react';
import { type Employee, type EmployeeRole } from '@/lib/data';
import { Users, UserCheck, UserX, Stethoscope, User, Filter, Tablet, UserCog } from 'lucide-react';

type Summary = {
  total: number;
  present: number;
  absent: number;
  license: number;
  roles: Record<EmployeeRole, number>;
};

export default function OfficeAttendanceSummary({ employees }: { employees: Employee[] }) {

  const summary = useMemo<Summary>(() => {
    const roles: Record<EmployeeRole, number> = {
        'Modulo': 0,
        'Filtro': 0,
        'Tablet': 0,
        'Supervisión': 0
    };
    employees.forEach(emp => {
        if(emp.role) {
            roles[emp.role] = (roles[emp.role] || 0) + 1;
        }
    });

    return {
      total: employees.length,
      present: employees.filter(emp => emp.status === 'Presente').length,
      absent: employees.filter(emp => emp.status === 'Ausente' && (emp.absenceReason === 'Inasistencia' || emp.absenceReason === 'Otro')).length,
      license: employees.filter(emp => emp.absenceReason === 'Licencia médica' || emp.absenceReason === 'Vacaciones').length,
      roles
    };
  }, [employees]);

  if (employees.length === 0) {
      return null;
  }

  return (
    <div className="hidden md:flex items-center gap-4 border-l pl-4 ml-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground" title="Total">
            <Users className="h-4 w-4" />
            <span className="font-bold text-foreground">{summary.total}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-700" title="Presentes">
            <UserCheck className="h-4 w-4" />
            <span className="font-bold">{summary.present}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-700" title="Ausentes">
            <UserX className="h-4 w-4" />
            <span className="font-bold">{summary.absent}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-yellow-700" title="Licencias / Vacaciones">
            <Stethoscope className="h-4 w-4" />
            <span className="font-bold">{summary.license}</span>
        </div>

        <div className="h-6 border-l mx-2"></div>

         <div className="flex items-center gap-2 text-sm text-gray-600" title="Módulo">
            <User className="h-4 w-4" />
            <span className="font-bold">{summary.roles['Modulo']}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600" title="Filtro">
            <Filter className="h-4 w-4" />
            <span className="font-bold">{summary.roles['Filtro']}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600" title="Tablet">
            <Tablet className="h-4 w-4" />
            <span className="font-bold">{summary.roles['Tablet']}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600" title="Supervisión">
            <UserCog className="h-4 w-4" />
            <span className="font-bold">{summary.roles['Supervisión']}</span>
        </div>
    </div>
  );
}
