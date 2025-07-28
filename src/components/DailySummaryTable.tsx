
"use client";

import { useMemo } from 'react';
import { DailySummary, EmployeeRole } from '@/lib/data';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';

type DailySummaryTableProps = {
  summaries: DailySummary[];
  onDelete: (summaryId: string) => void;
};

const ROLES: EmployeeRole[] = ['Modulo', 'Anfitrión', 'Tablet'];

export default function DailySummaryTable({ summaries, onDelete }: DailySummaryTableProps) {
  
  const sortedSummaries = useMemo(() => {
    return summaries.sort((a, b) => b.date.toMillis() - a.date.toMillis());
  }, [summaries]);

  if (summaries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center">
        No hay resúmenes diarios guardados.
      </p>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {sortedSummaries.map((summary) => (
        <AccordionItem value={summary.id} key={summary.id}>
          <AccordionTrigger>
            <span className="font-semibold text-base">
              {format(summary.date.toDate(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <Table>
                <TableHeader className="bg-primary/10">
                    <TableRow>
                        <TableHead className="font-bold text-primary">Oficina</TableHead>
                        {ROLES.map(role => (
                            <TableHead key={role} className="text-center font-bold text-primary">{role}</TableHead>
                        ))}
                        <TableHead className="font-bold text-primary">Ausentes</TableHead>
                        <TableHead className="font-bold text-primary text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.values(summary.summary).sort((a,b) => a.name.localeCompare(b.name)).map(officeData => (
                        <TableRow key={officeData.name}>
                            <TableCell className="font-medium">{officeData.name}</TableCell>
                            {ROLES.map(role => (
                                <TableCell key={role} className="text-center">
                                    {officeData.realStaffing[role] || 0}
                                </TableCell>
                            ))}
                             <TableCell className="text-xs">{officeData.absent || '-'}</TableCell>
                             <TableCell></TableCell>
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell colSpan={ROLES.length + 3} className="text-right py-2 pr-4">
                             <Button variant="ghost" size="icon" onClick={() => onDelete(summary.id)} className="h-8 w-8">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
