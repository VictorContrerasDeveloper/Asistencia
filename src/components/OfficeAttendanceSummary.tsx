
"use client";

import { useMemo } from 'react';
import { type Employee } from '@/lib/data';
import { UserCheck, UserX } from 'lucide-react';

type Summary = {
  present: number;
  absent: number;
};

export default function OfficeAttendanceSummary({ employees }: { employees: Employee[] }) {

  const summary = useMemo<Summary>(() => {
    return {
      present: employees.filter(emp => emp.status === 'Presente').length,
      absent: employees.filter(emp => emp.status === 'Ausente').length,
    };
  }, [employees]);

  if (employees.length === 0) {
      return null;
  }

  return (
    <div className="hidden md:flex items-center gap-4 border-l pl-4 ml-4">
        <div className="flex items-center gap-2 text-sm text-green-700" title="Presentes">
            <UserCheck className="h-4 w-4" />
            <span className="font-bold">{summary.present}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-700" title="Ausentes">
            <UserX className="h-4 w-4" />
            <span className="font-bold">{summary.absent}</span>
        </div>
    </div>
  );
}
