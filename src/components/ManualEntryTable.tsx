
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
import { Save, Copy } from 'lucide-react';
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
    const newStaffing = {
      ...realStaffing,
      [officeId]: {
        ...realStaffing[officeId],
        [role]: value,
      }
    };
    setRealStaffing(newStaffing);
  };

  const handleCopyToReal = (office: Office) => {
    const theoreticalValues = office.theoreticalStaffing || {};
    const newOfficeStaffing = { ...realStaffing[office.id] };

    ROLES.forEach(role => {
      newOfficeStaffing[role] = (theoreticalValues[role] || 0).toString();
    });

    setRealStaffing(prev => ({
      ...prev,
      [office.id]: newOfficeStaffing,
    }));

    toast({
      title: "Valores Copiados",
      description: `La dotación teórica de ${office.name} ha sido copiada a la real.`,
    });
  };
  
  const handleSave = async (officeId: string) => {
    const officeStaffing = realStaffing[officeId];
    const newRealStaffing: { [key in EmployeeRole]?: number } = {};
    
    let hasError = false;
    for (const r in ROLES) {
        const currentRole = ROLES[r as any];
        const aValue = officeStaffing[currentRole];
        if (aValue === '' || aValue === undefined) {
          newRealStaffing[currentRole] = 0;
          continue;
        };
        const numberValue = parseInt(aValue, 10);
        if (isNaN(numberValue) || numberValue < 0) {
            hasError = true;
            break;
        }
        newRealStaffing[currentRole] = numberValue;
    }

    if (hasError) {
       toast({
          title: "Error de validación",
          description: "Ingresa solo números positivos.",
          variant: "destructive",
      });
      return;
    }
    
    try {
        await updateOfficeRealStaffing(officeId, newRealStaffing);
        toast({
            title: "¡Éxito!",
            description: "Dotación real guardada correctamente.",
        });
    } catch(e) {
         toast({
            title: "Error",
            description: "No se pudo guardar la información.",
            variant: "destructive",
        });
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
                    <Button size="sm" variant="outline" className="h-8" onClick={() => handleCopyToReal(office)}>
                      <Copy className="h-4 w-4 mr-2"/>
                      Copiar Teórico
                    </Button>
                  </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
