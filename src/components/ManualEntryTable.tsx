
"use client";

import { useState, useEffect } from 'react';
import { type EmployeeRole, type Office, updateOfficeRealStaffing } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import React from 'react';

type ManualEntryTableProps = {
  offices: Office[];
};

const ROLES: EmployeeRole[] = ['Modulo', 'Anfitrión', 'Tablet'];

type RealStaffingValues = {
  [officeId: string]: {
    [key in EmployeeRole]?: string;
  };
};

export default function ManualEntryTable({ offices }: ManualEntryTableProps) {
  const { toast } = useToast();
  const [realStaffing, setRealStaffing] = useState<RealStaffingValues>({});
  const [isSaving, setIsSaving] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    const initialStaffing: RealStaffingValues = {};
    offices.forEach(office => {
      initialStaffing[office.id] = {};
      ROLES.forEach(role => {
        initialStaffing[office.id][role] = office.realStaffing?.[role]?.toString() || '';
      });
    });
    setRealStaffing(initialStaffing);
  }, [offices]);

  const handleStaffingChange = (officeId: string, role: EmployeeRole, value: string) => {
    setRealStaffing(prev => ({
      ...prev,
      [officeId]: {
        ...prev[officeId],
        [role]: value,
      }
    }));
  };

  const handleSave = async (officeId: string) => {
     setIsSaving(prev => ({...prev, [officeId]: true}));
    const officeStaffing = realStaffing[officeId];
    const newRealStaffing: { [key in EmployeeRole]?: number } = {};
    
    let hasError = false;
    for (const role in officeStaffing) {
        const value = officeStaffing[role as EmployeeRole];
        if (value === '' || value === undefined) {
          newRealStaffing[role as EmployeeRole] = 0;
          continue;
        };
        const numberValue = parseInt(value, 10);
        if (isNaN(numberValue) || numberValue < 0) {
            hasError = true;
            break;
        }
        newRealStaffing[role as EmployeeRole] = numberValue;
    }

    if (hasError) {
      toast({
        title: "Error de validación",
        description: "Por favor, ingresa solo números positivos en los campos.",
        variant: "destructive",
      });
      setIsSaving(prev => ({...prev, [officeId]: false}));
      return;
    }

    try {
      await updateOfficeRealStaffing(officeId, newRealStaffing);
      toast({
        title: "¡Guardado!",
        description: `La dotación para la oficina ha sido actualizada.`,
      });
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "Ocurrió un problema al intentar guardar los datos.",
        variant: "destructive",
      });
    } finally {
        setIsSaving(prev => ({...prev, [officeId]: false}));
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-card border-r-2 border-muted-foreground font-bold text-primary">Oficina Comercial</TableHead>
            {ROLES.map(role => (
              <TableHead key={role} colSpan={2} className="text-center border-r-2 border-muted-foreground font-bold text-primary">{role}</TableHead>
            ))}
            <TableHead className="text-right font-bold text-primary">Acciones</TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="sticky left-0 bg-card border-r-2 border-muted-foreground"></TableHead>
            {ROLES.map(role => (
              <React.Fragment key={`${role}-sub`}>
                <TableHead className="text-center font-bold text-primary">Real</TableHead>
                <TableHead className="text-center border-r-2 border-muted-foreground font-bold text-primary">Teori.</TableHead>
              </React.Fragment>
            ))}
             <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offices.map(office => (
            <TableRow key={office.id}>
              <TableCell className="font-medium sticky left-0 bg-card border-r-2 border-muted-foreground">{office.name}</TableCell>
              {ROLES.map(role => (
                 <React.Fragment key={role}>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={realStaffing[office.id]?.[role] || ''}
                        onChange={(e) => handleStaffingChange(office.id, role, e.target.value)}
                        className="h-8 w-20 mx-auto text-center"
                      />
                    </TableCell>
                    <TableCell className="text-center border-r-2 border-muted-foreground">{office.theoreticalStaffing?.[role] || 0}</TableCell>
                </React.Fragment>
              ))}
              <TableCell className="text-right">
                <Button size="sm" onClick={() => handleSave(office.id)} disabled={isSaving[office.id]}>
                  {isSaving[office.id] ? 'Guardando...' : <><Save className="h-4 w-4 mr-2"/> Guardar</>}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
