
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

const STATUSES: AttendanceStatus[] = ['Presente', 'Ausente'];
const ABSENCE_REASONS: Exclude<AbsenceReason, null>[] = ['Inasistencia', 'Licencia médica', 'Vacaciones', 'Otro'];
const ROLES: EmployeeRole[] = ['Modulo', 'Filtro', 'Tablet', 'Supervisión'];

export default function DashboardClient({ initialEmployees, offices, officeId }: { initialEmployees: Employee[], offices: Office[], officeId: string }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const { toast } = useToast();

  useEffect(() => {
    setEmployees(initialEmployees);
  }, [initialEmployees]);

  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);
  
  const handleStatusChange = async (employeeId: string, newStatus: AttendanceStatus) => {
    const updates: Partial<Employee> = { status: newStatus };
    if (newStatus === 'Presente') {
      updates.absenceReason = null;
    } else {
      updates.absenceReason = 'Inasistencia'; // Default reason when switching to Ausente
    }

    setEmployees(currentEmployees => 
      currentEmployees.map(emp => 
        emp.id === employeeId ? { ...emp, ...updates } : emp
      )
    );

    try {
      await updateEmployee(employeeId, updates);
    } catch (error) {
      console.error("Failed to update employee status:", error);
      setEmployees(initialEmployees);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado.",
        variant: "destructive",
      });
    }
  };

  const handleAbsenceReasonChange = async (employeeId: string, newReason: AbsenceReason) => {
     setEmployees(currentEmployees => 
      currentEmployees.map(emp => 
        emp.id === employeeId ? { ...emp, absenceReason: newReason } : emp
      )
    );
    try {
      await updateEmployee(employeeId, { absenceReason: newReason });
    } catch (error) {
       console.error("Failed to update employee absence reason:", error);
       setEmployees(initialEmployees);
       toast({
        title: "Error",
        description: "No se pudo actualizar el motivo de la ausencia.",
        variant: "destructive",
      });
    }
  };


  const handleRoleChange = async (employeeId: string, newRole: EmployeeRole) => {
    const currentEmployee = employees.find(emp => emp.id === employeeId);
    if (!currentEmployee) return;

    const oldRole = currentEmployee.role;
    if (oldRole === newRole) return;

    const isChangingRequiredRole = oldRole === 'Filtro' || oldRole === 'Tablet' || oldRole === 'Supervisión';

    if (isChangingRequiredRole) {
        const employeesInOffice = employees.filter(emp => emp.officeId === currentEmployee.officeId);
        const roleCount = employeesInOffice.filter(emp => emp.role === oldRole).length;

        if (roleCount <= 1) {
            toast({
                title: "Cambio no permitido",
                description: `Debe haber al menos un ejecutivo con la función "${oldRole}" en esta oficina.`,
                variant: "destructive",
            });
            return; // Block the change
        }
    }
    
    // Optimistic UI update
    setEmployees(currentEmployees => 
      currentEmployees.map(emp => 
        emp.id === employeeId ? { ...emp, role: newRole } : emp
      )
    );

    try {
      await updateEmployee(employeeId, { role: newRole });
    } catch (error) {
      console.error("Failed to update employee role:", error);
      // Revert UI change on failure
      setEmployees(initialEmployees);
      toast({
        title: "Error",
        description: "No se pudo actualizar la función.",
        variant: "destructive",
      });
    }
  };


  const getOfficeName = (officeId: string) => {
    return offices.find(o => o.id === officeId)?.name || 'N/A';
  }

  return (
    <div className="bg-card rounded-lg border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            <TableHead className="w-[25%] text-primary font-bold text-lg">Ejecutivo</TableHead>
            <TableHead className="w-[20%] text-primary font-bold text-lg">Trabaja en</TableHead>
            <TableHead className="w-[15%] text-center text-primary font-bold text-lg">Presente</TableHead>
            <TableHead className="w-[15%] text-center text-primary font-bold text-lg">Ausente</TableHead>
            <TableHead className="w-[25%] text-primary font-bold text-lg">Motivo Ausencia</TableHead>
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
              <TableCell className="text-center">
                   <RadioGroup 
                      value={employee.status} 
                      onValueChange={(value) => handleStatusChange(employee.id, value as AttendanceStatus)}
                      className="flex justify-center"
                    >
                      <RadioGroupItem value="Presente" id={`presente-${employee.id}`} className="h-5 w-5" />
                   </RadioGroup>
                </TableCell>
                <TableCell className="text-center">
                   <RadioGroup 
                      value={employee.status} 
                      onValueChange={(value) => handleStatusChange(employee.id, value as AttendanceStatus)}
                      className="flex justify-center"
                    >
                      <RadioGroupItem value="Ausente" id={`ausente-${employee.id}`} className="h-5 w-5" />
                   </RadioGroup>
              </TableCell>
              <TableCell>
                <Select
                  value={employee.absenceReason || ''}
                  onValueChange={(value) => handleAbsenceReasonChange(employee.id, value as AbsenceReason)}
                  disabled={employee.status === 'Presente'}
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
              No hay ejecutivos para mostrar.
          </div>
        )}
    </div>
  );
}
