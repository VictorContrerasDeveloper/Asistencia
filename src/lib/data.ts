
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
  { id: '7', name: 'Sub. Gerente Helpbank' },
  { id: '8', name: 'Prevencion Riesgo' },
];

let employees: Employee[] = [];

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
