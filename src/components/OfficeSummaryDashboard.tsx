
"use client";

import { useMemo } from 'react';
import { type Employee, type Office, slugify } from '@/lib/data';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, UserCheck, UserX, Stethoscope, Building } from 'lucide-react';

type OfficeSummary = {
  office: Office;
  total: number;
  present: number;
  absent: number;
  license: number;
};

export default function OfficeSummaryDashboard({ offices, employees }: { offices: Office[], employees: Employee[] }) {

  const officeSummaries = useMemo<OfficeSummary[]>(() => {
    return offices.map(office => {
      const officeEmployees = employees.filter(emp => emp.officeId === office.id);
      return {
        office,
        total: officeEmployees.length,
        present: officeEmployees.filter(emp => emp.status === 'Presente').length,
        absent: officeEmployees.filter(emp => emp.status === 'Ausente').length,
        license: officeEmployees.filter(emp => emp.status === 'Licencia').length,
      };
    }).sort((a,b) => a.office.name.localeCompare(b.office.name));
  }, [offices, employees]);

  if (officeSummaries.length === 0) {
      return (
        <div className="text-center p-8 text-muted-foreground bg-card rounded-lg shadow-md">
            No hay oficinas para mostrar. Agrega una para comenzar.
        </div>
      )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {officeSummaries.map(({ office, total, present, absent, license }) => (
        <Link href={`/dashboard/${slugify(office.name)}`} key={office.id} className="group">
          <Card className="h-full hover:border-primary hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-primary">{office.name}</CardTitle>
               <div className="p-3 bg-primary/10 rounded-full">
                  <Building className="h-6 w-6 text-primary" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div className='flex items-center gap-3'>
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Total Ejecutivos</span>
                  </div>
                  <span className="font-bold text-lg">{total}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                 <div className="p-2 rounded-md bg-green-100/60">
                    <p className="text-2xl font-bold text-green-800">{present}</p>
                    <p className="text-xs font-semibold text-green-700 uppercase">Presentes</p>
                 </div>
                  <div className="p-2 rounded-md bg-red-100/60">
                    <p className="text-2xl font-bold text-red-800">{absent}</p>
                    <p className="text-xs font-semibold text-red-700 uppercase">Ausentes</p>
                 </div>
                  <div className="p-2 rounded-md bg-yellow-100/60">
                    <p className="text-2xl font-bold text-yellow-800">{license}</p>
                    <p className="text-xs font-semibold text-yellow-700 uppercase">Licencias</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
