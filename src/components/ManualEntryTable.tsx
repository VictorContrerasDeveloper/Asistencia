
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
    
    // Autosave on change
    const officeStaffing = newStaffing[officeId];
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

    if (!hasError) {
      updateOfficeRealStaffing(officeId, newRealStaffing);
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
          </TableRow>
          <TableRow>
            <TableHead className="sticky left-0 bg-card border-r-2 border-muted-foreground"></TableHead>
            {ROLES.map(role => (
              <React.Fragment key={`${role}-sub`}>
                <TableHead className="text-center font-bold text-primary">Real</TableHead>
                <TableHead className="text-center border-r-2 border-muted-foreground font-bold text-primary">Teori.</TableHead>
              </React.Fragment>
            ))}
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
                        onBlur={(e) => {
                             if (e.target.value === '' || parseInt(e.target.value, 10) < 0 || isNaN(parseInt(e.target.value, 10))) {
                                toast({
                                    title: "Error de validación",
                                    description: "Ingresa solo números positivos.",
                                    variant: "destructive",
                                });
                             }
                        }}
                        className="h-8 w-20 mx-auto text-center"
                      />
                    </TableCell>
                    <TableCell className="text-center border-r-2 border-muted-foreground">{office.theoreticalStaffing?.[role] || 0}</TableCell>
                </React.Fragment>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
