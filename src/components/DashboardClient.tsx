
"use client";

import { useState, useMemo, useEffect } from 'react';
import { type Employee, type Office, type AttendanceStatus, updateEmployee, getOfficeById, addOffice as apiAddOffice, deleteEmployee } from '@/lib/data';
import Link from 'next/link';
import EmployeeCard from './EmployeeCard';
import EditOfficeModal from './EditOfficeModal';
import AddOfficeModal from './AddOfficeModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { Button } from './ui/button';
import { PlusCircle, Users } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

const STATUSES: AttendanceStatus[] = ['Atrasado', 'Presente', 'Ausente'];

function StatusColumn({ status, employees, onEdit, onDelete, officeName, canDelete }: { status: AttendanceStatus, employees: Employee[], onEdit: (employee: Employee) => void, onDelete: (employee: Employee) => void, officeName?: string, canDelete: boolean }) {
  const { setNodeRef } = useDroppable({ id: status });

  const statusConfig = {
     Presente: {
      title: `Presentes en ${officeName}`,
      bgColor: 'bg-green-100 dark:bg-green-900/50',
      borderColor: 'border-green-500',
      textColor: 'text-green-800 dark:text-green-200',
    },
    Atrasado: {
      title: 'Pendientes / Atrasados',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-800 dark:text-yellow-200',
    },
    Ausente: {
      title: 'Ausentes',
      bgColor: 'bg-red-100 dark:bg-red-900/50',
      borderColor: 'border-red-500',
      textColor: 'text-red-800 dark:text-red-200',
    }
  };
  
  const config = statusConfig[status];
  
  return (
    <div ref={setNodeRef} className={`flex-1 rounded-lg p-4 min-h-[300px] transition-colors duration-300 ${config.bgColor}`}>
      <h2 className={`text-lg font-bold pb-2 mb-4 border-b-2 ${config.borderColor} ${config.textColor}`}>
        {status === 'Presente' && officeName !== 'Panel General' ? `Presentes en ${officeName}` : config.title} ({employees.length})
      </h2>
      <div className="space-y-4">
        {employees.map(employee => (
          <EmployeeCard key={employee.id} employee={employee} onEdit={onEdit} onDelete={() => onDelete(employee)} showDelete={canDelete} />
        ))}
      </div>
    </div>
  )
}

export default function DashboardClient({ initialEmployees, offices, officeName, officeId }: { initialEmployees: Employee[], offices: Office[], officeName: string, officeId: string }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [isAddOfficeModalOpen, setAddOfficeModalOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setEmployees(initialEmployees);
  }, [initialEmployees]);

  const employeesByStatus = useMemo(() => {
    return employees.reduce((acc, employee) => {
      acc[employee.status].push(employee);
      return acc;
    }, { Presente: [], Atrasado: [], Ausente: [] } as Record<AttendanceStatus, Employee[]>);
  }, [employees]);


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const employeeId = active.id as string;
      const newStatus = over.id as AttendanceStatus;
      
      const employee = employees.find(e => e.id === employeeId);
      if(employee && employee.status !== newStatus) {
        updateEmployee(employeeId, { status: newStatus });
        setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, status: newStatus } : e));
      }
    }
  };

  const handleOpenEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
  };
  
  const handleOpenDeleteModal = (employee: Employee) => {
    setDeletingEmployee(employee);
  };

  const handleCloseModal = () => {
    setEditingEmployee(null);
    setDeletingEmployee(null);
  };
  
  const handleSaveOffice = async (employeeId: string, newOfficeId: string) => {
    await updateEmployee(employeeId, { officeId: newOfficeId });
    
    setEmployees(async prev => {
      const newOffice = await getOfficeById(newOfficeId);
      if (officeName !== 'Panel General' && newOffice?.name !== officeName) {
        return prev.filter(e => e.id !== employeeId);
      }
      return prev.map(e => e.id === employeeId ? { ...e, officeId: newOfficeId } : e)
    });
    handleCloseModal();
  };

  const handleAddOffice = async (name: string) => {
    if (!name) {
      toast({
        title: "Error",
        description: "Por favor, ingresa el nombre de la oficina.",
        variant: "destructive",
      });
      return;
    }
    await apiAddOffice(name);
    toast({
        title: "¡Éxito!",
        description: "La oficina ha sido agregada correctamente.",
    });
    setAddOfficeModalOpen(false);
    router.refresh();
  };

  const handleDeleteEmployee = async () => {
    if(!deletingEmployee) return;

    try {
      await deleteEmployee(deletingEmployee.id);
      setEmployees(prev => prev.filter(e => e.id !== deletingEmployee.id));
      toast({
        title: "¡Éxito!",
        description: `El ejecutivo ${deletingEmployee.name} ha sido eliminado.`,
      });
    } catch (error) {
       toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el ejecutivo.",
        variant: "destructive",
      });
    } finally {
        handleCloseModal();
    }
  }

  const canDelete = officeId === 'general';

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="p-4 md:p-8 space-y-8">
        {officeId === 'general' && (
            <div className="flex justify-center gap-4">
                 <Button onClick={() => setAddOfficeModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Oficina
                </Button>
                <Link href="/dashboard/add-employee">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Ejecutivo
                </Button>
            </Link>
            <Link href="/dashboard/bulk-add-employees">
                <Button>
                    <Users className="mr-2 h-4 w-4" />
                    Carga Masiva
                </Button>
            </Link>
            </div>
        )}
        <div className="flex flex-col md:flex-row gap-6">
          {STATUSES.map(status => (
            <StatusColumn
              key={status}
              status={status}
              employees={employeesByStatus[status]}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
              officeName={officeName}
              canDelete={canDelete}
            />
          ))}
        </div>
      </div>
      {editingEmployee && (
        <EditOfficeModal
          employee={editingEmployee}
          offices={offices}
          isOpen={!!editingEmployee}
          onClose={handleCloseModal}
          onSave={handleSaveOffice}
        />
      )}
      <AddOfficeModal
        isOpen={isAddOfficeModalOpen}
        onClose={() => setAddOfficeModalOpen(false)}
        onSave={handleAddOffice}
      />
       {deletingEmployee && (
        <AlertDialog open={!!deletingEmployee} onOpenChange={setDeletingEmployee}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente al ejecutivo <strong>{deletingEmployee.name}</strong> de la base de datos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteEmployee}>
                Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </DndContext>
  );
}
