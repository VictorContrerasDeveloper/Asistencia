
"use client";

import { useState, useMemo, useEffect } from 'react';
import { type Employee, type Office, type AttendanceStatus, updateEmployee, getOfficeById, addOffice as apiAddOffice } from '@/lib/data';
import Link from 'next/link';
import EmployeeCard from './EmployeeCard';
import EditOfficeModal from './EditOfficeModal';
import AddOfficeModal from './AddOfficeModal';
import { DndContext, type DragEndEvent, useDroppable, DragOverlay, type DragOverEvent } from '@dnd-kit/core';
import { Button } from './ui/button';
import { PlusCircle, Users, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

const STATUSES: AttendanceStatus[] = ['Atrasado', 'Presente', 'Ausente'];

function StatusColumn({ status, employees, onEdit, officeName, overEmployeeId }: { status: AttendanceStatus, employees: Employee[], onEdit: (employee: Employee) => void, officeName?: string, overEmployeeId?: string | null }) {
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
  
  const overIndex = overEmployeeId ? employees.findIndex(e => e.id === overEmployeeId) : -1;

  return (
    <div ref={setNodeRef} className={`flex-1 rounded-lg p-4 min-h-[300px] transition-colors duration-300 ${config.bgColor}`}>
      <h2 className={`text-lg font-bold pb-2 mb-4 border-b-2 ${config.borderColor} ${config.textColor}`}>
        {status === 'Presente' && officeName !== 'Panel General' ? `Presentes en ${officeName}` : config.title} ({employees.length})
      </h2>
      <div className="space-y-4">
        {employees.map((employee, index) => {
            const isBelow = overIndex !== -1 && index >= overIndex;
            const transform = isBelow ? 'translateY(80px)' : 'translateY(0)';
            return (
              <div key={employee.id} style={{ transition: 'transform 0.25s ease-in-out', transform  }}>
                <EmployeeCard employee={employee} onEdit={onEdit} />
              </div>
            );
        })}
      </div>
    </div>
  )
}

export default function DashboardClient({ initialEmployees, offices, officeName, officeId }: { initialEmployees: Employee[], offices: Office[], officeName: string, officeId: string }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAddOfficeModalOpen, setAddOfficeModalOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [overEmployeeId, setOverEmployeeId] = useState<string | null>(null);

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
    setOverEmployeeId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const employeeId = active.id as string;
      const newStatus = over.id as AttendanceStatus;
      
      const employee = employees.find(e => e.id === employeeId);
      // Check if it's a valid status column before updating
      if(employee && employee.status !== newStatus && STATUSES.includes(newStatus)) {
        updateEmployee(employeeId, { status: newStatus });
        setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, status: newStatus } : e));
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      // If we are over an employee card, we get its id
      // The id is in over.data.droppableContainer.id
      const overId = over.data?.droppableContainer?.id as string || over.id as string;
      const employeeOver = employees.find(e => e.id === overId);

      if (employeeOver) {
         setOverEmployeeId(employeeOver.id)
      } else {
        // If we are over a column but not a card
        const isColumn = STATUSES.includes(over.id as AttendanceStatus);
        if (isColumn && employeesByStatus[over.id as AttendanceStatus].length === 0) {
             setOverEmployeeId(null);
        } else if (!employeeOver) {
            // Keep the last over employee if we are not over a column
            const isAnotherEmployee = employees.some(e => e.id === overId);
            if (!isAnotherEmployee) setOverEmployeeId(null);
        }
      }
    }
  };


  const handleOpenEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
  };
  
  const handleCloseModal = () => {
    setEditingEmployee(null);
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

  return (
    <DndContext onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDragCancel={() => setOverEmployeeId(null)}>
      <div className="p-4 md:p-8 space-y-8">
        {officeId === 'general' && (
             <div className="flex flex-wrap justify-center gap-4">
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
            <Link href="/dashboard/delete-employee">
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Ejecutivo(s)
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
              officeName={officeName}
              overEmployeeId={overEmployeeId}
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
    </DndContext>
  );
}
