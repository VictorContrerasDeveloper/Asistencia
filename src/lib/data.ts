
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

let employees: Employee[] = [
    { id: 'e1', name: 'Patricia Astorga Soto', officeId: '6', status: 'Presente' },
    { id: 'e2', name: 'Patricia Ríos Contreras', officeId: '3', status: 'Presente' },
    { id: 'e3', name: 'Leyla Andrea Soto García', officeId: '4', status: 'Presente' },
    { id: 'e4', name: 'Jorge Alexis Martínez Tapia', officeId: '1', status: 'Presente' },
    { id: 'e5', name: 'Johanna Contreras Salfate', officeId: '2', status: 'Presente' },
    { id: 'e6', name: 'Jesennia Torres Aguilar', officeId: '6', status: 'Presente' },
    { id: 'e7', name: 'Carlos Vera Carvajal', officeId: '5', status: 'Presente' },
    { id: 'e8', name: 'Jenny Llanillos Aguilar', officeId: '5', status: 'Presente' },
    { id: 'e9', name: 'Paula Andrea Muñoz Ceriani', officeId: '1', status: 'Presente' },
    { id: 'e10', name: 'Clarisa Silva Maldonado', officeId: '4', status: 'Presente' },
    { id: 'e11', name: 'Maria Soledad Zuñiga Hernandez', officeId: '3', status: 'Presente' },
    { id: 'e12', name: 'Carola Andrea Valladares Poblete', officeId: '5', status: 'Presente' },
    { id: 'e13', name: 'Solanch Quezada Morales', officeId: '5', status: 'Presente' },
    { id: 'e14', name: 'Marisol Abarca Toro', officeId: '5', status: 'Presente' },
    { id: 'e15', name: 'Patricia Reyes Osorio', officeId: '1', status: 'Presente' },
    { id: 'e16', name: 'Nicole Belen Muñoz Silva', officeId: '5', status: 'Presente' },
    { id: 'e17', name: 'Sixtina Rojo Astorga', officeId: '4', status: 'Presente' },
    { id: 'e18', name: 'Athan Alonso Abarca Vidal', officeId: '4', status: 'Presente' },
    { id: 'e19', name: 'Rosaliz Pacheco Asuaje', officeId: '6', status: 'Presente' },
    { id: 'e20', name: 'Sandra Alarcon Parada', officeId: '5', status: 'Presente' },
    { id: 'e21', name: 'Yaritza Huaiquinao Peñaloza', officeId: '2', status: 'Presente' },
    { id: 'e22', name: 'Fabian Jesus Muñoz Ceriani', officeId: '1', status: 'Presente' },
    { id: 'e23', name: 'Teresa del Carmen Marillanca Torres', officeId: '2', status: 'Presente' },
    { id: 'e24', name: 'Karina Andrea Sobino Perez', officeId: '5', status: 'Presente' },
    { id: 'e25', name: 'Marisol Cornejo Díaz', officeId: '1', status: 'Presente' },
    { id: 'e26', name: 'Paulina Gloria Opazo Villalobos', officeId: '5', status: 'Presente' },
    { id: 'e27', name: 'Nicole Martinez Escobar', officeId: '5', status: 'Presente' },
    { id: 'e28', name: 'Nisnoibeth Rodriguez Nery', officeId: '5', status: 'Presente' },
    { id: 'e29', name: 'Mary Cruz Oviedo De Cedeño', officeId: '5', status: 'Presente' },
    { id: 'e30', name: 'Constanza Antonia Azocar Bascuñan', officeId: '5', status: 'Presente' },
    { id: 'e31', name: 'Jessica Rodríguez Anríquez', officeId: '2', status: 'Presente' },
    { id: 'e32', name: 'Annais Arenas Pardo', officeId: '2', status: 'Presente' },
    { id: 'e33', name: 'Jocelyn de Lourdes Larenas Jimenez', officeId: '2', status: 'Presente' },
    { id: 'e34', name: 'Muriel Andrea Aranguiz Lazo', officeId: '2', status: 'Presente' },
    { id: 'e35', name: 'Margott Vidal Gómez', officeId: '1', status: 'Presente' },
    { id: 'e36', name: 'Lucia Begoña Vargas Paillan', officeId: '1', status: 'Presente' },
    { id: 'e37', name: 'Analia Adriazola Quintupill', officeId: '4', status: 'Presente' },
    { id: 'e38', name: 'Oscar Boris Soto Muñoz', officeId: '3', status: 'Presente' },
    { id: 'e39', name: 'Gisel Olivares Jofre', officeId: '6', status: 'Presente' },
    { id: 'e40', name: 'Anchely Taborda de Ortega', officeId: '3', status: 'Presente' },
    { id: 'e41', name: 'Fresia Miranda Diaz', officeId: '2', status: 'Presente' },
    { id: 'e42', name: 'Jaidemarie Deutelmoser', officeId: '6', status: 'Presente' },
    { id: 'e43', name: 'Isabel Margarita Riquelme Sepulveda', officeId: '6', status: 'Presente' },
    { id: 'e44', name: 'Ana Belen Bascur Salas', officeId: '3', status: 'Presente' },
    { id: 'e45', name: 'Consuelo del Pilar Salazar Roman', officeId: '4', status: 'Presente' },
    { id: 'e46', name: 'Alexandra Rodriguez silva', officeId: '4', status: 'Presente' },
    { id: 'e47', name: 'Josefa Antonia Leal Pirela', officeId: '3', status: 'Presente' },
    { id: 'e48', name: 'Erika Caceres Lobos', officeId: '5', status: 'Presente' },
    { id: 'e49', name: 'Reina Bueno Gateño', officeId: '3', status: 'Presente' },
    { id: 'e50', name: 'Vanesa Rojas Peña', officeId: '1', status: 'Presente' },
    { id: 'e51', name: 'Maria Angelica Valenzuela Hernandez', officeId: '2', status: 'Presente' },
    { id: 'e52', name: 'Jose Luis Cañas Caicedo', officeId: '6', status: 'Presente' },
    { id: 'e53', name: 'Lilian Gutiérrez Velásquez', officeId: '1', status: 'Presente' },
    { id: 'e54', name: 'Violeta Astorga Maturana', officeId: '3', status: 'Presente' },
    { id: 'e55', name: 'Jhaneilis Vera Montiel', officeId: '6', status: 'Presente' },
    { id: 'e56', name: 'Valeria Irene Lizama Guzmán', officeId: '1', status: 'Presente' },
    { id: 'e57', name: 'Flor Maria Diaz Hernandez', officeId: '5', status: 'Presente' },
    { id: 'e58', name: 'Marcela Gonzalez Liempi', officeId: '6', status: 'Presente' },
    { id: 'e59', name: 'Maritza Norambuena Estay', officeId: '2', status: 'Presente' },
    { id: 'e60', name: 'Javiera Paz Fernandez Ramirez', officeId: '4', status: 'Presente' },
    { id: 'e61', name: 'Magaly Sonia Retamal Castro', officeId: '3', status: 'Presente' },
    { id: 'e62', name: 'Aida Farfan Gutierrez', officeId: '6', status: 'Presente' },
    { id: 'e63', name: 'Benjamín Ignacio Martinez Mallega', officeId: '1', status: 'Presente' },
    { id: 'e64', name: 'Camila Marillanaca', officeId: '1', status: 'Presente' },
    { id: 'e65', name: 'Catalina Rojas Barrales', officeId: '5', status: 'Presente' },
    { id: 'e66', name: 'Michelle Casanova Gutierrez', officeId: '2', status: 'Presente' },
    { id: 'e67', name: 'Evelyn Robinson Mallega', officeId: '6', status: 'Presente' },
    { id: 'e68', name: 'Jocelyn Alejandra Pino Pinto', officeId: '5', status: 'Presente' },
    { id: 'e69', name: 'Julissa Andrea Venegas Carreño', officeId: '4', status: 'Presente' },
    { id: 'e70', name: 'Fernando Hernandez', officeId: '7', status: 'Presente' },
    { id: 'e71', name: 'Christian Lezana', officeId: '8', status: 'Presente' },
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
