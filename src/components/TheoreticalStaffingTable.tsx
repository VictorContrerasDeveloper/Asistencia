
"use client";

import { useState, useEffect } from 'react';
import { type Office, updateOfficeStaffing, EmployeeRole } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

type StaffingValues = {
  [officeId: string]: {
    [key in EmployeeRole]?: string;
  };
};

type OfficeSummary = {
  id: string;
  name: string;
  theoreticalStaffing?: {
    [key in EmployeeRole]?: number;
  };
};

type TheoreticalStaffingTableProps = {
  offices: OfficeSummary[];
  roles: EmployeeRole[];
};

export default function TheoreticalStaffingTable({ offices, roles }: TheoreticalStaffingTableProps) {
  const { toast } = useToast();
  const [staffingValues, setStaffingValues] = useState<StaffingValues>({});

  useEffect(() => {
    const initialStaffing: StaffingValues = {};
    offices.forEach(office => {
      initialStaffing[office.id] = {};
      roles.forEach(role => {
        initialStaffing[office.id][role] = office.theoreticalStaffing?.[role]?.toString() || '';
      });
    });
    setStaffingValues(initialStaffing);
  }, [offices, roles]);

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
        title: "Dotación Guardada",
        description: "Se ha guardado la dotación teórica.",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la dotación teórica.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dotación Teórica por Oficina</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-primary text-primary-foreground">
              <TableRow>
                <TableHead className="font-bold text-primary-foreground p-2">Oficina Comercial</TableHead>
                {roles.map(role => (
                  <TableHead key={role} className="text-center font-bold text-primary-foreground p-2">{role}</TableHead>
                ))}
                <TableHead className="text-right font-bold text-primary-foreground p-2">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offices.map(office => (
                <TableRow key={office.id}>
                  <TableCell className="font-medium p-2">{office.name}</TableCell>
                  {roles.map(role => (
                    <TableCell key={role} className="p-2">
                      <Input
                        id={`staffing-${office.id}-${role}`}
                        type="number"
                        min="0"
                        placeholder="0"
                        value={staffingValues[office.id]?.[role] || ''}
                        onChange={(e) => handleStaffingChange(office.id, role, e.target.value)}
                        className="h-8 w-20 mx-auto text-center"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-right p-2">
                    <Button size="sm" className="h-8 px-3" onClick={() => handleSaveStaffing(office.id)}>
                      <Save className="h-4 w-4 mr-2"/>
                      Guardar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
