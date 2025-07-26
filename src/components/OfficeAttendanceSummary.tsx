
"use client";

import { useMemo } from 'react';
import { type Employee, type EmployeeRole, type Office } from '@/lib/data';
import { UserCheck, UserX, User, Tablet, Shield, Clipboard, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type Summary = {
  present: number;
  absent: number;
  late: number;
  roles: Record<EmployeeRole, number>;
};

const ROLES_ORDER: EmployeeRole[] = ['Supervisión', 'Modulo', 'Tablet', 'Filtro'];

const roleIcons: Record<EmployeeRole, React.ElementType> = {
    'Modulo': Clipboard,
    'Filtro': Shield,
    'Tablet': Tablet,
    'Supervisión': User,
}

export default function OfficeAttendanceSummary({ employees, office }: { employees: Employee[], office: Office }) {

  const summary = useMemo<Summary>(() => {
    const roles: Record<EmployeeRole, number> = {
      'Supervisión': 0,
      'Modulo': 0,
      'Tablet': 0,
      'Filtro': 0,
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
        <div className="flex flex-col items-start gap-1">
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

        <Separator orientation="vertical" className="h-16" />

        <div className="flex flex-col items-start gap-1">
            {ROLES_ORDER.map(role => {
                 const realCount = summary.roles[role] || 0;
                 const theoreticalCount = office.theoreticalStaffing?.[role] || 0;
                 return (
                    <div key={role} className="flex items-center gap-2 font-medium" title={`Real vs Teórico ${role}`}>
                        <span>{role}:</span>
                        <span className="font-bold text-foreground">{realCount} / {theoreticalCount}</span>
                    </div>
                 )
            })}
        </div>
    </div>
  );
}
