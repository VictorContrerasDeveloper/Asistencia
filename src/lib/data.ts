export type Office = {
  id: string;
  name: string;
};

export type AttendanceStatus = 'Presente' | 'Atrasado' | 'Ausente';

export type Employee = {
  id: string;
  name: string;
  officeId: string;
  status: AttendanceStatus;
};

const offices: Office[] = [
  { id: '1', name: 'Of. Com. Maipú' },
  { id: '2', name: 'Of. Com. Gran Avenida' },
  { id: '3', name: 'Of. Com. Plaza Egaña' },
  { id: '4', name: 'Of. Com. Mall Plaza Norte' },
  { id: '5', name: 'Of. Com. Centro' },
  { id: '6', name: 'Of. Com. Providencia' },
];

let employees: Employee[] = [
  { id: 'e1', name: 'Ana García', officeId: '1', status: 'Presente' },
  { id: 'e2', name: 'Luis Pérez', officeId: '1', status: 'Presente' },
  { id: 'e3', name: 'Carla Rojas', officeId: '1', status: 'Ausente' },
  { id: 'e4', name: 'Pedro Soto', officeId: '2', status: 'Presente' },
  { id: 'e5', name: 'María López', officeId: '2', status: 'Atrasado' },
  { id: 'e6', name: 'Juan Morales', officeId: '3', status: 'Presente' },
  { id: 'e7', name: 'Sofía Castro', officeId: '3', status: 'Presente' },
  { id: 'e8', name: 'Diego Reyes', officeId: '4', status: 'Ausente' },
  { id: 'e9', name: 'Valentina Muñoz', officeId: '4', status: 'Presente' },
  { id: 'e10', name: 'Javier Torres', officeId: '5', status: 'Presente' },
  { id: 'e11', name: 'Isidora Flores', officeId: '5', status: 'Atrasado' },
  { id: 'e12', name: 'Benjamín Navarro', officeId: '6', status: 'Presente' },
  { id: 'e13', name: 'Catalina Silva', officeId: '6', status: 'Presente' },
  { id: 'e14', name: 'Matias Gonzalez', officeId: '2', status: 'Ausente' },
  { id: 'e15', name: 'Fernanda Ortiz', officeId: '1', status: 'Atrasado' },
];

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/[\.com-]+/g, "") // remove .com
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export const getOffices = (): Office[] => offices;

export const getOfficeBySlug = (slug: string): Office | undefined => {
  return offices.find(office => slugify(office.name) === slug);
}

export const getEmployees = (officeSlug?: string): Employee[] => {
  if (!officeSlug || officeSlug === 'general') {
    return employees;
  }
  const office = getOfficeBySlug(officeSlug);
  if (!office) {
    return [];
  }
  return employees.filter(employee => employee.officeId === office.id);
};

export const updateEmployee = (employeeId: string, newStatus?: AttendanceStatus, newOfficeId?: string) => {
    employees = employees.map(emp => {
        if (emp.id === employeeId) {
            return {
                ...emp,
                status: newStatus ?? emp.status,
                officeId: newOfficeId ?? emp.officeId,
            }
        }
        return emp;
    });
    return employees.find(e => e.id === employeeId);
}

export const addEmployee = (name: string, officeId: string) => {
  const newEmployee: Employee = {
    id: `e${employees.length + 1}`,
    name,
    officeId,
    status: 'Presente', // Default status
  };
  employees.push(newEmployee);
  return newEmployee;
};
