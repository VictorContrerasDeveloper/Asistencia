
"use client";

import { useState, useMemo, useEffect } from 'react';
import { type Employee, type Office, type AttendanceStatus, type EmployeeRole, updateEmployee, type AbsenceReason } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import OfficeAttendanceSummary from './OfficeAttendanceSummary';
import { Check, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ABSENCE_REASONS: Exclude<AbsenceReason, null>[] = ['Inasistencia', 'Licencia médica', 'Vacaciones', 'Otro'];
const ROLES: EmployeeRole[] = ['Modulo', 'Anfitrión', 'Tablet', 'Supervisión'];

type DashboardClientProps = {
  initialEmployees: Employee[];
  offices: Office[];
  office: Office;
  officeHeader: React.ReactNode;
};

export default function DashboardClient({ initialEmployees, offices, office, officeHeader }: DashboardClientProps) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const { toast } = useToast();

  useEffect(() => {
    setEmployees(initialEmployees);
  }, [initialEmployees]);

  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);
  
  const handleUpdate = async (employeeId: string, updates: Partial<Employee>) => {
    const originalEmployees = [...employees];

    // Optimistic UI update
    setEmployees(currentEmployees =>
        currentEmployees.map(emp =>
            emp.id === employeeId ? { ...emp, ...updates } : emp
        )
    );

    try {
        await updateEmployee(employeeId, updates);
    } catch (error) {
        console.error("Failed to update employee:", error);
        // Revert on failure
        setEmployees(originalEmployees); 
        toast({
            title: "Error",
            description: "No se pudo actualizar la información.",
            variant: "destructive",
        });
    }
  };

  const handleStatusChange = (employeeId: string, newStatus: AttendanceStatus) => {
    const updates: Partial<Employee> = { status: newStatus };
    if (newStatus === 'Presente' || newStatus === 'Atrasado') {
      updates.absenceReason = null;
    } else {
      // Default reason when switching to Ausente, if they had none
      const currentEmployee = employees.find(e => e.id === employeeId);
      if(currentEmployee?.status === 'Presente' || currentEmployee?.status === 'Atrasado') {
          updates.absenceReason = 'Inasistencia';
      }
    }
    handleUpdate(employeeId, updates);
  };

  const handleAbsenceReasonChange = (employeeId: string, newReason: AbsenceReason) => {
     handleUpdate(employeeId, { absenceReason: newReason });
  };


  const handleRoleChange = async (employeeId: string, newRole: EmployeeRole) => {
    const currentEmployee = employees.find(emp => emp.id === employeeId);
    if (!currentEmployee || currentEmployee.role === newRole) return;

    const oldRole = currentEmployee.role;
    const isChangingRequiredRole = oldRole === 'Anfitrión' || oldRole === 'Tablet' || oldRole === 'Supervisión';

    if (isChangingRequiredRole) {
        const employeesInOffice = employees.filter(emp => emp.officeId === currentEmployee.officeId);
        const roleCount = employeesInOffice.filter(emp => emp.role === oldRole).length;

        if (roleCount <= 1) {
            toast({
                title: "Cambio no permitido",
                description: `Debe haber al menos una persona con la función "${oldRole}" en esta oficina.`,
                variant: "destructive",
            });
            // Revert invalid selection in UI
            setEmployees(prev => [...prev]);
            return; 
        }
    }
    
    handleUpdate(employeeId, { role: newRole });
  };


  const getOfficeName = (officeId: string) => {
    return offices.find(o => o.id === officeId)?.name || 'N/A';
  }

  const radioItemClasses = "h-8 w-8 rounded-md border-2 data-[state=checked]:text-primary-foreground";

  return (
    <div className="h-full flex flex-col">
       <header className="flex items-center justify-between p-4 border-b bg-card">
           {officeHeader}
           <OfficeAttendanceSummary employees={employees} office={office} />
       </header>

       <div className="flex-grow bg-card rounded-lg border overflow-auto mt-8">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-primary text-primary-foreground">
              <TableRow>
                <TableHead className="w-[25%] font-bold text-lg text-primary-foreground">Personal asignado</TableHead>
                <TableHead className="w-[20%] font-bold text-lg text-primary-foreground">Función</TableHead>
                <TableHead className="text-center font-bold text-lg text-primary-foreground">Presente</TableHead>
                <TableHead className="text-center font-bold text-lg text-primary-foreground">Atrasado</TableHead>
                <TableHead className="text-center font-bold text-lg text-primary-foreground">Ausente</TableHead>
                <TableHead className="w-[25%] font-bold text-lg text-primary-foreground">Motivo Ausencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="font-medium">{employee.name}</div>
                  </TableCell>
                  <TableCell>
                    <Select value={employee.role} onValueChange={(value) => handleRoleChange(employee.id, value as EmployeeRole)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar función" />
                        </SelectTrigger>
                        <SelectContent>
                            {ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                    {role}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell colSpan={3}>
                       <RadioGroup 
                          value={employee.status} 
                          onValueChange={(value) => handleStatusChange(employee.id, value as AttendanceStatus)}
                          className="flex justify-around items-center"
                        >
                            <RadioGroupItem value="Presente" id={`presente-${employee.id}`} className={cn(radioItemClasses, 'data-[state=checked]:bg-green-600 border-green-600')}>
                              <Check className="h-6 w-6" />
                            </RadioGroupItem>
                            <RadioGroupItem value="Atrasado" id={`atrasado-${employee.id}`} className={cn(radioItemClasses, 'data-[state=checked]:bg-orange-500 border-orange-500')}>
                              <Clock className="h-6 w-6" />
                            </RadioGroupItem>
                            <RadioGroupItem value="Ausente" id={`ausente-${employee.id}`} className={cn(radioItemClasses, 'data-[state=checked]:bg-red-600 border-red-600')}>
                              <X className="h-6 w-6" />
                            </RadioGroupItem>
                       </RadioGroup>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={employee.absenceReason || ''}
                      onValueChange={(value) => handleAbsenceReasonChange(employee.id, value as AbsenceReason)}
                      disabled={employee.status === 'Presente' || employee.status === 'Atrasado'}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {ABSENCE_REASONS.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {sortedEmployees.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                  No hay personal para mostrar.
              </div>
            )}
        </div>
    </div>
  );
}
