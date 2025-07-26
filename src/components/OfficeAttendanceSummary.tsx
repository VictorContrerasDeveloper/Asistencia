
"use client";

import { useMemo } from 'react';
import { type Employee, type EmployeeRole } from '@/lib/data';
import { UserCheck, UserX, User, Tablet, Shield, Clipboard, Clock } from 'lucide-react';

type Summary = {
  present: number;
  absent: number;
  late: number;
  roles: Record<EmployeeRole, number>;
};

const ROLES: EmployeeRole[] = ['Supervisión', 'Modulo', 'Tablet', 'Filtro'];

const roleIcons: Record<EmployeeRole, React.ElementType> = {
    'Modulo': Clipboard,
    'Filtro': Shield,
    'Tablet': Tablet,
    'Supervisión': User,
}

export default function OfficeAttendanceSummary({ employees }: { employees: Employee[] }) {

  const summary = useMemo<Summary>(() => {
    const roles: Record<EmployeeRole, number> = {
      'Modulo': 0,
      'Filtro': 0,
      'Tablet': 0,
      'Supervisión': 0,
    };
    
    employees.forEach(emp => {
      if(roles[emp.role] !== undefined && (emp.status === 'Presente' || emp.status === 'Atrasado')) {
          roles[emp.role]++;
      }
    });

    return {
      present: employees.filter(emp => emp.status === 'Presente').length,
      absent: employees.filter(emp => emp.status === 'Ausente').length,
      late: employees.filter(emp => emp.status === 'Atrasado').length,
      roles,
    };
  }, [employees]);

  if (employees.length === 0) {
      return null;
  }

  return (
    <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-medium" title="Presentes">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span>Presentes:</span>
                <span className="font-bold text-foreground">{summary.present}</span>
            </div>
            <div className="flex items-center gap-2 font-medium" title="Atrasados">
                <Clock className="h-4 w-4 text-orange-600" />
                <span>Atrasados:</span>
                <span className="font-bold text-foreground">{summary.late}</span>
            </div>
            <div className="flex items-center gap-2 font-medium" title="Ausentes">
                <UserX className="h-4 w-4 text-red-600" />
                <span>Ausentes:</span>
                <span className="font-bold text-foreground">{summary.absent}</span>
            </div>
        </div>

        <div className="flex items-center gap-4 border-l border-border pl-6">
            {ROLES.map(role => {
                 const Icon = roleIcons[role];
                 const presentCount = summary.roles[role];
                 return (
                    <div key={role} className="flex items-center gap-2" title={role}>
                        <Icon className="h-4 w-4" />
                        <span>{role}:</span>
                        <span className="font-bold text-foreground">{presentCount}</span>
                    </div>
                 )
            })}
        </div>
    </div>
  );
}
