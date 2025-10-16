
"use client";

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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Employee, updateEmployee, deleteEmployee, EmployeeRole, EmployeeLevel, Office, AttendanceStatus, AbsenceReason, WorkMode, EmploymentType } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Pencil, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatInTimeZone } from 'date-fns-tz';
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

type EditEmployeeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedEmployee: Employee) => void;
  employee: Employee;
  offices: Office[];
};

const ROLES: EmployeeRole[] = ['Supervisión', 'Modulo', 'Tablet', 'Anfitrión'];
const LEVELS: EmployeeLevel[] = ['Nivel 1', 'Nivel 2', 'Nivel intermedio', 'Nivel Básico'];
const STATUSES: AttendanceStatus[] = ['Presente', 'Atrasado', 'Ausente'];
const ABSENCE_REASONS: Exclude<AbsenceReason, null>[] = ['Inasistencia', 'Licencia médica', 'Vacaciones', 'Otro'];
const PROLONGED_ABSENCE_REASONS: AbsenceReason[] = ['Licencia médica', 'Vacaciones', 'Otro'];
const WORK_MODES: WorkMode[] = ['Operaciones', 'Administrativo'];
const EMPLOYMENT_TYPES: EmploymentType[] = ['Full-Time', 'Part-Time'];

export default function EditEmployeeModal({ 
    isOpen, 
    onClose, 
    onSuccess, 
    employee, 
    offices,
}: EditEmployeeModalProps) {
  const { toast } = useToast();
  const [newName, setNewName] = useState(employee.name);
  const [newRole, setNewRole] = useState<EmployeeRole>(employee.role);
  const [newLevel, setNewLevel] = useState<EmployeeLevel>(employee.level || 'Nivel Básico');
  const [newOfficeId, setNewOfficeId] = useState(employee.officeId);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>(employee.status);
  const [newAbsenceReason, setNewAbsenceReason] = useState<AbsenceReason>(employee.absenceReason);
  const [newAbsenceEndDate, setNewAbsenceEndDate] = useState<Date | undefined>();
  const [newWorkMode, setNewWorkMode] = useState<WorkMode>(employee.workMode);
  const [newEmploymentType, setNewEmploymentType] = useState<EmploymentType>(employee.employmentType);
  const [newPhone, setNewPhone] = useState(employee.phone || '');
  const [newEmail, setNewEmail] = useState(employee.email || '');
  const [newSalesforceUser, setNewSalesforceUser] = useState(employee.salesforceUser || '');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isNameEditable, setIsNameEditable] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewName(employee.name);
      setNewRole(employee.role);
      setNewLevel(employee.level || 'Nivel Básico');
      setNewOfficeId(employee.officeId);
      setNewStatus(employee.status);
      setNewAbsenceReason(employee.absenceReason);
      setNewAbsenceEndDate(employee.absenceEndDate ? parseISO(employee.absenceEndDate) : undefined);
      setNewWorkMode(employee.workMode || 'Operaciones');
      setNewEmploymentType(employee.employmentType || 'Full-Time');
      setNewPhone(employee.phone || '');
      setNewEmail(employee.email || '');
      setNewSalesforceUser(employee.salesforceUser || '');
      setIsNameEditable(false);
    }
  }, [isOpen, employee]);

  const handleStatusChange = (status: AttendanceStatus) => {
    setNewStatus(status);
    if(status !== 'Ausente') {
      setNewAbsenceReason(null);
      setNewAbsenceEndDate(undefined);
    } else {
      if(!newAbsenceReason) {
          setNewAbsenceReason('Inasistencia');
      }
    }
  }
  
  const handleReasonChange = (reason: AbsenceReason) => {
      setNewAbsenceReason(reason);
      if(!PROLONGED_ABSENCE_REASONS.includes(reason)) {
          setNewAbsenceEndDate(undefined);
      }
  }

  const handleSave = async () => {
    const hasChanged = newName !== employee.name ||
                     newRole !== employee.role ||
                     newLevel !== (employee.level || 'Nivel Básico') ||
                     newOfficeId !== employee.officeId ||
                     newStatus !== employee.status ||
                     newAbsenceReason !== employee.absenceReason ||
                     newWorkMode !== employee.workMode ||
                     newEmploymentType !== (employee.employmentType || 'Full-Time') ||
                     newPhone !== (employee.phone || '') ||
                     newEmail !== (employee.email || '') ||
                     newSalesforceUser !== (employee.salesforceUser || '') ||
                     (newAbsenceEndDate ? formatInTimeZone(newAbsenceEndDate, 'UTC', 'yyyy-MM-dd') : null) !== (employee.absenceEndDate || null);

    if (!hasChanged) {
        onClose();
        return;
    }
    if (!newName.trim()) {
        toast({
            title: "Error",
            description: "El nombre no puede estar vacío.",
            variant: "destructive"
        });
        return;
    }
    setIsSaving(true);
    
    const updates: Partial<Employee> = {};
    if (newName !== employee.name) updates.name = newName;
    if (newRole !== employee.role) updates.role = newRole;
    if (newLevel !== (employee.level || 'Nivel Básico')) updates.level = newLevel;
    if (newOfficeId !== employee.officeId) updates.officeId = newOfficeId;
    if (newStatus !== employee.status) updates.status = newStatus;
    if (newWorkMode !== employee.workMode) updates.workMode = newWorkMode;
    if (newEmploymentType !== (employee.employmentType || 'Full-Time')) updates.employmentType = newEmploymentType;
    if (newPhone !== (employee.phone || '')) updates.phone = newPhone;
    if (newEmail !== (employee.email || '')) updates.email = newEmail;
    if (newSalesforceUser !== (employee.salesforceUser || '')) updates.salesforceUser = newSalesforceUser;
    
    if (newStatus === 'Ausente') {
        updates.absenceReason = newAbsenceReason;
        updates.absenceEndDate = newAbsenceEndDate ? formatInTimeZone(newAbsenceEndDate, 'UTC', 'yyyy-MM-dd') : null
    } else {
        updates.absenceReason = null;
        updates.absenceEndDate = null;
    }

    try {
        await updateEmployee(employee.id, updates);
        const updatedEmployee: Employee = {
            ...employee,
            ...updates,
        };
        onSuccess(updatedEmployee);
    } catch (error) {
        toast({
            title: "Error",
            description: "No se pudo completar la actualización.",
            variant: "destructive"
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
        await deleteEmployee(employee.id);
        toast({
            title: "Personal Eliminado",
            description: `${employee.name} ha sido eliminado/a permanentemente.`,
        });
        // We pass the deleted employee so the parent can filter it out
        onSuccess(employee);
    } catch (error) {
        toast({
            title: "Error de Eliminación",
            description: "No se pudo eliminar al ejecutivo.",
            variant: "destructive"
        });
    } finally {
        setIsSaving(false);
        setAlertOpen(false);
    }
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar a {employee.name}</DialogTitle>
          <DialogDescription>
            Modifica los datos de este ejecutivo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
           <div className="space-y-1">
             <Label htmlFor="new-name">Nombre</Label>
             <div className="flex items-center gap-2">
                <Input
                    id="new-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nombre del ejecutivo"
                    disabled={!isNameEditable}
                />
                <Button variant="outline" size="icon" onClick={() => setIsNameEditable(true)} className="shrink-0">
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => setAlertOpen(true)} disabled={isSaving}>
                    <Trash2 className="h-4 w-4" />
                </Button>
             </div>
           </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <Label htmlFor="new-phone">Teléfono de contacto</Label>
                <Input id="new-phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+569..." />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-email">Correo electrónico</Label>
                <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="ejecutivo@example.com" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-salesforce">Usuario Salesforce</Label>
                <Input id="new-salesforce" value={newSalesforceUser} onChange={(e) => setNewSalesforceUser(e.target.value)} placeholder="usuario.sf" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                 <Label htmlFor="new-work-mode">Modo de Trabajo</Label>
                 <Select value={newWorkMode} onValueChange={(value) => setNewWorkMode(value as WorkMode)}>
                    <SelectTrigger id="new-work-mode">
                        <SelectValue placeholder="Selecciona un modo" />
                    </SelectTrigger>
                    <SelectContent>
                        {WORK_MODES.map((mode) => (
                            <SelectItem key={mode} value={mode}>
                                {mode}
                            </SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
               </div>
               <div className="space-y-1">
                 <Label htmlFor="new-employment-type">Modo de Contratación</Label>
                 <Select value={newEmploymentType} onValueChange={(value) => setNewEmploymentType(value as EmploymentType)}>
                    <SelectTrigger id="new-employment-type">
                        <SelectValue placeholder="Selecciona un modo" />
                    </SelectTrigger>
                    <SelectContent>
                        {EMPLOYMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                                {type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
               </div>
            </div>
           <div className="space-y-1">
             <Label htmlFor="new-office">Oficina</Label>
             <Select value={newOfficeId} onValueChange={setNewOfficeId} disabled={newWorkMode === 'Administrativo'}>
                <SelectTrigger id="new-office">
                    <SelectValue placeholder="Selecciona una oficina" />
                </SelectTrigger>
                <SelectContent>
                    {offices.map((office) => (
                        <SelectItem key={office.id} value={office.id}>
                            {office.name}
                        </SelectItem>
                    ))}
                </SelectContent>
             </Select>
           </div>
          <div className="space-y-1">
             <Label htmlFor="new-role">Rol</Label>
             <Select value={newRole} onValueChange={(value) => setNewRole(value as EmployeeRole)}>
                <SelectTrigger id="new-role">
                    <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                    {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                            {role}
                        </SelectItem>
                    ))}
                </SelectContent>
             </Select>
          </div>
          <div className="space-y-1">
             <Label htmlFor="new-level">Nivel</Label>
             <Select value={newLevel} onValueChange={(value) => setNewLevel(value as EmployeeLevel)}>
                <SelectTrigger id="new-level">
                    <SelectValue placeholder="Selecciona un nivel" />
                </SelectTrigger>
                <SelectContent>
                    {LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                            {level}
                        </SelectItem>
                    ))}
                </SelectContent>
             </Select>
          </div>
          <div className="space-y-1">
             <Label htmlFor="new-status">Estado</Label>
             <Select value={newStatus} onValueChange={(value) => handleStatusChange(value as AttendanceStatus)}>
                <SelectTrigger id="new-status">
                    <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                    {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                            {status}
                        </SelectItem>
                    ))}
                </SelectContent>
             </Select>
          </div>

          {newStatus === 'Ausente' && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="new-absence-reason">Motivo Ausencia</Label>
                  <Select value={newAbsenceReason || ''} onValueChange={(value) => handleReasonChange(value as AbsenceReason)}>
                      <SelectTrigger id="new-absence-reason">
                          <SelectValue placeholder="Selecciona un motivo" />
                      </SelectTrigger>
                      <SelectContent>
                          {ABSENCE_REASONS.map((reason) => (
                              <SelectItem key={reason} value={reason}>
                                  {reason}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
                
                {newAbsenceReason && PROLONGED_ABSENCE_REASONS.includes(newAbsenceReason) && (
                    <div className="space-y-1">
                        <Label htmlFor="new-absence-endDate">Fecha de Término</Label>
                         <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !newAbsenceEndDate && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newAbsenceEndDate ? format(newAbsenceEndDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={newAbsenceEndDate}
                                onSelect={(date) => {
                                    setNewAbsenceEndDate(date)
                                    setIsCalendarOpen(false)
                                }}
                                initialFocus
                                locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                )}
              </>
          )}

        </div>
        <DialogFooter className="justify-end pt-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Confirmar Cambios'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente a 
            <strong> {employee.name}</strong> y todos sus datos asociados.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
            Sí, eliminar
            </AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
