
"use client";

import { useMemo, useState, useEffect } from 'react';
import { type Employee, type Office, updateOfficeStaffing, EmployeeRole } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, UserCheck, UserX, Stethoscope, Building, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

type Summary = {
  total: number;
  present: number;
  absent: number;
  license: number;
};

const ROLES_ORDER: EmployeeRole[] = ['Supervisión', 'Modulo', 'Tablet', 'Filtro'];

type OfficeSummary = Summary & {
  id: string;
  name: string;
  theoreticalStaffing?: {
    [key in EmployeeRole]?: number;
  };
  realStaffing: {
    [key in EmployeeRole]?: number;
  };
};

// Defines the state structure for staffing input values
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


  const globalSummary = useMemo<Summary>(() => {
    return {
      total: employees.length,
      present: employees.filter(emp => emp.status === 'Presente' || emp.status === 'Atrasado').length,
      absent: employees.filter(emp => emp.status === 'Ausente' && (emp.absenceReason === 'Inasistencia' || emp.absenceReason === 'Otro')).length,
      license: employees.filter(emp => emp.absenceReason === 'Licencia médica' || emp.absenceReason === 'Vacaciones').length,
    };
  }, [employees]);

  const officeSummaries = useMemo<OfficeSummary[]>(() => {
    return offices.map(office => {
      const officeEmployees = employees.filter(emp => emp.officeId === office.id);
      
      const realStaffing: { [key in EmployeeRole]?: number } = {};
      ROLES_ORDER.forEach(role => {
          realStaffing[role] = officeEmployees.filter(emp => emp.role === role && (emp.status === 'Presente' || emp.status === 'Atrasado')).length;
      });

      return {
        id: office.id,
        name: office.name,
        total: officeEmployees.length,
        present: officeEmployees.filter(emp => emp.status === 'Presente' || emp.status === 'Atrasado').length,
        absent: officeEmployees.filter(emp => emp.status === 'Ausente' && (emp.absenceReason === 'Inasistencia' || emp.absenceReason === 'Otro')).length,
        license: officeEmployees.filter(emp => emp.absenceReason === 'Licencia médica' || emp.absenceReason === 'Vacaciones').length,
        theoreticalStaffing: office.theoreticalStaffing,
        realStaffing
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
        <Card>
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
                    <span className="font-medium">Total Personal</span>
                  </div>
                  <span className="font-bold text-lg">{globalSummary.total}</span>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <span className="font-medium text-yellow-800">Licencias/Vac.</span>
                    </div>
                    <span className="font-bold text-2xl text-yellow-800">{globalSummary.license}</span>
                 </div>
              </div>
            </CardContent>
          </Card>
        
        <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Detalle por Oficina</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {officeSummaries.map(summary => (
                    <Card key={summary.id}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                             <CardTitle className="text-base font-semibold">{summary.name}</CardTitle>
                             <div className="p-2 bg-accent/10 rounded-full">
                                <Building className="h-5 w-5 text-accent" />
                             </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                             <div className="flex items-center justify-between text-sm pt-2">
                                <span className="text-muted-foreground">Total</span>
                                <span className="font-semibold">{summary.total}</span>
                             </div>
                             <div className="flex items-center justify-between text-sm">
                                <span className="text-green-700">Presentes</span>
                                <span className="font-semibold text-green-700">{summary.present}</span>
                             </div>
                             <div className="flex items-center justify-between text-sm">
                                <span className="text-red-700">Ausentes</span>
                                <span className="font-semibold text-red-700">{summary.absent}</span>
                             </div>
                             <div className="flex items-center justify-between text-sm">
                                <span className="text-yellow-700">Licencias/Vac.</span>
                                <span className="font-semibold text-yellow-700">{summary.license}</span>
                             </div>
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
