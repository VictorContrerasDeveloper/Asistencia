
"use client";

import { useMemo } from 'react';
import { type Employee, type Office } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, UserCheck, UserX, Stethoscope } from 'lucide-react';

type GlobalSummary = {
  total: number;
  present: number;
  absent: number;
  license: number;
};

export default function OfficeSummaryDashboard({ offices, employees }: { offices: Office[], employees: Employee[] }) {

  const globalSummary = useMemo<GlobalSummary>(() => {
    return {
      total: employees.length,
      present: employees.filter(emp => emp.status === 'Presente').length,
      absent: employees.filter(emp => emp.status === 'Ausente').length,
      license: employees.filter(emp => emp.status === 'Licencia').length,
    };
  }, [employees]);

  if (employees.length === 0) {
      return (
        <div className="text-center p-8 text-muted-foreground bg-card rounded-lg shadow-md">
            No hay ejecutivos para mostrar. Agrega uno para comenzar.
        </div>
      )
  }

  return (
    <div className="flex justify-center items-start">
        <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-primary">Resumen General de Asistencia</CardTitle>
               <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
               <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div className='flex items-center gap-3'>
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Total Ejecutivos</span>
                  </div>
                  <span className="font-bold text-lg">{globalSummary.total}</span>
              </div>

               <div className="space-y-3">
                 <div className="flex items-center justify-between p-3 rounded-md bg-green-100/60">
                    <div className='flex items-center gap-3'>
                        <UserCheck className="h-5 w-5 text-green-700" />
                        <span className="font-medium text-green-800">Presentes</span>
                    </div>
                    <span className="font-bold text-2xl text-green-800">{globalSummary.present}</span>
                 </div>
                  <div className="flex items-center justify-between p-3 rounded-md bg-red-100/60">
                    <div className='flex items-center gap-3'>
                        <UserX className="h-5 w-5 text-red-700" />
                        <span className="font-medium text-red-800">Ausentes</span>
                    </div>
                    <span className="font-bold text-2xl text-red-800">{globalSummary.absent}</span>
                 </div>
                  <div className="flex items-center justify-between p-3 rounded-md bg-yellow-100/60">
                     <div className='flex items-center gap-3'>
                        <Stethoscope className="h-5 w-5 text-yellow-700" />
                        <span className="font-medium text-yellow-800">Licencias</span>
                    </div>
                    <span className="font-bold text-2xl text-yellow-800">{globalSummary.license}</span>
                 </div>
              </div>

            </CardContent>
          </Card>
    </div>
  );
}
