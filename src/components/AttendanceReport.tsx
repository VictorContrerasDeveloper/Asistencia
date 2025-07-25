"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserX, Clock, Clipboard, ClipboardCheck } from 'lucide-react';
import { type Employee, type AttendanceStatus } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";

type AttendanceReportProps = {
  employeesByStatus: Record<AttendanceStatus, Employee[]>;
};

export default function AttendanceReport({ employeesByStatus }: AttendanceReportProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const counts = {
    Presente: employeesByStatus.Presente.length,
    Atrasado: employeesByStatus.Atrasado.length,
    Ausente: employeesByStatus.Ausente.length,
  };

  const handleCopy = () => {
    const reportText = `Reporte de Asistencia Diario:
- Presentes: ${counts.Presente}
- Atrasados: ${counts.Atrasado}
- Ausentes: ${counts.Ausente}
- Total: ${counts.Presente + counts.Atrasado + counts.Ausente}`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      toast({
        title: "¡Reporte Copiado!",
        description: "El resumen de asistencia ha sido copiado a tu portapapeles.",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Reporte Diario</CardTitle>
        <Button variant="outline" onClick={handleCopy}>
          {copied ? <ClipboardCheck className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}
          {copied ? '¡Copiado!' : 'Copiar Reporte'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Presente</CardTitle>
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">{counts.Presente}</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Atrasado</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{counts.Atrasado}</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Ausente</CardTitle>
              <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800 dark:text-red-200">{counts.Ausente}</div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
