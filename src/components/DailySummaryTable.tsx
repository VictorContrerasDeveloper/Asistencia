
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
import { cn } from '@/lib/utils';

type DailySummaryTableProps = {
  summaries: DailySummary[];
  onDelete: (summaryId: string) => void;
};

const ROLES: EmployeeRole[] = ['Modulo', 'Anfitrión', 'Tablet'];

export default function DailySummaryTable({ summaries, onDelete }: DailySummaryTableProps) {
  
  const sortedSummaries = useMemo(() => {
    return summaries.sort((a, b) => a.date.toMillis() - b.date.toMillis());
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
          <AccordionTrigger className="py-2">
            <span className="font-semibold text-base capitalize">
              {format(summary.date.toDate(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex justify-end pr-4 pb-2">
                <Button variant="ghost" size="icon" onClick={() => onDelete(summary.id)} className="h-8 w-8">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
            <Table>
                <TableHeader className="bg-primary/10">
                    <TableRow>
                        <TableHead className="font-bold text-primary p-1 text-sm">Oficina</TableHead>
                        {ROLES.map(role => (
                            <TableHead key={role} className="text-center font-bold text-primary p-1 text-sm">{role}</TableHead>
                        ))}
                        <TableHead className="font-bold text-primary p-1 text-sm whitespace-nowrap">Ausencia del día</TableHead>
                        <TableHead className="font-bold text-primary p-1 text-sm whitespace-nowrap">Ausencias prolongadas</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.values(summary.summary).sort((a,b) => a.name.localeCompare(b.name)).map(officeData => {
                        return (
                            <TableRow key={officeData.name}>
                                <TableCell className="font-medium p-1">{officeData.name}</TableCell>
                                {ROLES.map(role => {
                                    const realCount = officeData.realStaffing[role] || 0;
                                    const isDeficit = realCount < (officeData.theoreticalStaffing?.[role as keyof typeof officeData.theoreticalStaffing] || 0);
                                    return (
                                        <TableCell key={role} className={cn("text-center font-bold p-1", isDeficit && "bg-red-600 text-white")}>
                                            {realCount}
                                        </TableCell>
                                    )
                                })}
                                 <TableCell className="text-xs p-1">{officeData.absent || '-'}</TableCell>
                                 <TableCell className="text-xs p-1 bg-red-100 dark:bg-red-950/30">{officeData.prolongedAbsences || '-'}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}


