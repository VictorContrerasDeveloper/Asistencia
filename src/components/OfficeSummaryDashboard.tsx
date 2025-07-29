
"use client";

import { useMemo, useState, useEffect } from 'react';
import { type Employee, type Office, updateOfficeStaffing, EmployeeRole } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import OfficeSummaryTable from './OfficeSummaryTable';
import TheoreticalStaffingTable from './TheoreticalStaffingTable';

const STAFFING_ROLES_ORDER: EmployeeRole[] = ['Modulo', 'Tablet', 'Anfitrión', 'Supervisión'];

type OfficeSummary = {
  id: string;
  name: string;
  employees: Employee[];
  theoreticalStaffing?: {
    [key in EmployeeRole]?: number;
  };
};

export default function OfficeSummaryDashboard({ offices, employees }: { offices: Office[], employees: Employee[] }) {
  
  const officeSummaries = useMemo<OfficeSummary[]>(() => {
    return offices.map(office => {
      const officeEmployees = employees.filter(emp => emp.officeId === office.id);
      return {
        id: office.id,
        name: office.name,
        employees: officeEmployees,
        theoreticalStaffing: office.theoreticalStaffing
      };
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [offices, employees]);

  if (employees.length === 0) {
      return (
        <div className="text-center p-8 text-muted-foreground bg-card rounded-lg shadow-md">
            No hay personal para mostrar. Agrega a alguien para comenzar.
        </div>
      )
  }

  return (
    <div className="space-y-8">
       <TheoreticalStaffingTable offices={officeSummaries} roles={STAFFING_ROLES_ORDER} />
    </div>
  );
}
