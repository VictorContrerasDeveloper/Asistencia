
"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getEmployees, bulkUpdateEmployeeNames, Employee } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

type BulkUpdateNamesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function BulkUpdateNamesModal({ isOpen, onClose, onSuccess }: BulkUpdateNamesModalProps) {
  const { toast } = useToast();
  const [nameUpdates, setNameUpdates] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchEmployees = async () => {
        const allEmployees = await getEmployees();
        allEmployees.sort((a, b) => a.name.localeCompare(b.name));
        setEmployees(allEmployees);
        const prefilledText = allEmployees.map(emp => `${emp.name} > `).join('\n');
        setNameUpdates(prefilledText);
      }
      fetchEmployees();
    } else {
      setNameUpdates('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameUpdates) {
      toast({
        title: "Error",
        description: "El campo de texto está vacío.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const { updated, notFound } = await bulkUpdateEmployeeNames(nameUpdates);
      
      let description = `Se actualizaron ${updated} nombres correctamente.`;
      if(notFound.length > 0) {
          description += ` No se encontraron los siguientes nombres: ${notFound.join(', ')}.`;
      }

      toast({
          title: "¡Éxito!",
          description: description,
      });

      if(updated > 0) {
        onSuccess();
      }
      onClose();
      
    } catch (error) {
       toast({
        title: "Error",
        description: "Ocurrió un error al actualizar los nombres.",
        variant: "destructive",
      });
    } finally {
        setIsSaving(false);
        setNameUpdates('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl grid-rows-[auto,1fr,auto]">
        <DialogHeader>
          <DialogTitle>Actualización Masiva de Nombres</DialogTitle>
          <DialogDescription>
            Usa el formato: <code className="font-mono text-sm bg-muted p-1 rounded">Nombre Actual > Nombre Nuevo</code> por cada línea.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-8 py-4 overflow-hidden">
          <div className="flex flex-col gap-4">
              <Label htmlFor="nameUpdates">Nombres a Actualizar</Label>
              <Textarea
                id="nameUpdates"
                value={nameUpdates}
                onChange={(e) => setNameUpdates(e.target.value)}
                placeholder="Ej:&#10;Juan Pérez > Juan Pérez González&#10;Maria Gonzalez > María de los Ángeles González"
                required
                className="h-full"
              />
          </div>
           <div className="flex flex-col gap-4">
            <Label>Personal Actual</Label>
              <ScrollArea className="h-full max-h-[400px] w-full rounded-md border p-4">
                <ul className="space-y-1">
                  {employees.map(employee => (
                    <li key={employee.id} className="text-sm">{employee.name}</li>
                  ))}
                </ul>
              </ScrollArea>
           </div>
        </div>
        <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>¡Importante!</AlertTitle>
            <AlertDescription>
                El nombre actual debe coincidir exactamente (mayúsculas y minúsculas no importan). Si un nombre no se encuentra, será ignorado.
            </AlertDescription>
        </Alert>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={isSaving} onClick={handleSubmit}>
              {isSaving ? 'Actualizando...' : 'Actualizar Nombres'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
