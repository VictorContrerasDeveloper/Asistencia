
"use client";

import { useMemo, useState, useEffect } from 'react';
import { type Employee, type Office, updateOfficeStaffing, EmployeeRole } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import OfficeSummaryTable from './OfficeSummaryTable';

const ROLES_ORDER: EmployeeRole[] = ['Supervisión', 'Modulo', 'Anfitrión', 'Tablet'];

type OfficeSummary = {
  id: string;
  name: string;
  employees: Employee[];
  theoreticalStaffing?: {
    [key in EmployeeRole]?: number;
  };
};

type StaffingValues = {
  [officeId: string]: {
    [key in EmployeeRole]?: string;
  };
};

export default function OfficeSummaryDashboard({ offices, employees }: { offices: Office[], employees: Employee[] }) {
  const { toast } = useToast();
  const [staffingValues, setStaffingValues] = useState<StaffingValues>({});

  useEffect(() => {
    const initialStaffing: StaffingValues = {};
    offices.forEach(office => {
      initialStaffing[office.id] = {};
      ROLES_ORDER.forEach(role => {
        initialStaffing[office.id][role] = office.theoreticalStaffing?.[role]?.toString() || '';
      });
    });
    setStaffingValues(initialStaffing);
  }, [offices]);


  const handleStaffingChange = (officeId: string, role: EmployeeRole, value: string) => {
    setStaffingValues(prev => ({ 
      ...prev, 
      [officeId]: {
        ...prev[officeId],
        [role]: value,
      }
    }));
  };

  const handleSaveStaffing = async (officeId: string) => {
    const officeStaffing = staffingValues[officeId];
    const newTheoreticalStaffing: { [key in EmployeeRole]?: number } = {};
    
    let hasError = false;
    for (const role in officeStaffing) {
        const value = officeStaffing[role as EmployeeRole];
        if (value === '' || value === undefined) {
          newTheoreticalStaffing[role as EmployeeRole] = 0;
          continue;
        };
        const numberValue = parseInt(value, 10);
        if (isNaN(numberValue) || numberValue < 0) {
            hasError = true;
            break;
        }
        newTheoreticalStaffing[role as EmployeeRole] = numberValue;
    }

    if (hasError) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un número válido para cada rol.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateOfficeStaffing(officeId, newTheoreticalStaffing);
      toast({
        title: "¡Éxito!",
        description: "Dotación teórica guardada correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la dotación teórica.",
        variant: "destructive",
      });
    }
  };

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
       <OfficeSummaryTable offices={officeSummaries} roles={ROLES_ORDER} />
        
        <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Dotación Teórica por Oficina</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {officeSummaries.map(summary => (
                    <Card key={summary.id}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                             <CardTitle className="text-base font-semibold">{summary.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                             <div className="border-t pt-3 mt-3 space-y-4">
                                <div className='flex justify-between items-center'>
                                  <Label className="text-sm font-medium">
                                    Dotación Teórica por Rol
                                  </Label>
                                   <Button size="sm" className="h-8" onClick={() => handleSaveStaffing(summary.id)}>
                                      <Save className="h-4 w-4 mr-2"/>
                                      Guardar
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                  {ROLES_ORDER.map(role => (
                                    <div key={role} className="flex items-center gap-2 justify-between">
                                      <Label htmlFor={`staffing-${summary.id}-${role}`} className="text-sm text-muted-foreground w-1/3">
                                        {role}
                                      </Label>
                                      <Input
                                        id={`staffing-${summary.id}-${role}`}
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={staffingValues[summary.id]?.[role] || ''}
                                        onChange={(e) => handleStaffingChange(summary.id, role, e.target.value)}
                                        className="h-8"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </div>
  );
}
