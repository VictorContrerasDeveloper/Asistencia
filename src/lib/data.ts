
import { app } from './firebase';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  addDoc,
  getDoc,
  writeBatch,
} from 'firebase/firestore';

export type Office = {
  id: string;
  name: string;
};

export type AttendanceStatus = 'Presente' | 'Atrasado' | 'Ausente';

export type Employee = {
  id:string;
  name: string;
  officeId: string;
  status: AttendanceStatus;
};

const db = getFirestore(app);
const officesCollection = collection(db, 'offices');
const employeesCollection = collection(db, 'employees');


// Initial data for seeding
const initialOffices: Omit<Office, 'id'>[] = [
    { name: 'Of. Com. Maipú' },
    { name: 'Of. Com. Gran Avenida' },
    { name: 'Of. Com. Plaza Egaña' },
    { name: 'Of. Com. Mall Plaza Norte' },
    { name: 'Of. Com. Centro' },
    { name: 'Of. Com. Providencia' },
    { name: 'Sub. Gerente Helpbank' },
    { name: 'Prevencion Riesgo' },
];

const initialEmployees: Omit<Employee, 'id' | 'officeId'> & { officeName: string }[] = [
    { name: 'Patricia Astorga Soto', officeName: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Patricia Ríos Contreras', officeName: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Leyla Andrea Soto García', officeName: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Jorge Alexis Martínez Tapia', officeName: 'Of. Com. Maipú', status: 'Atrasado' },
    { name: 'Johanna Contreras Salfate', officeName: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Jesennia Torres Aguilar', officeName: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Carlos Vera Carvajal', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Jenny Llanillos Aguilar', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Paula Andrea Muñoz Ceriani', officeName: 'Of. Com. Maipú', status: 'Atrasado' },
    { name: 'Clarisa Silva Maldonado', officeName: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Maria Soledad Zuñiga Hernandez', officeName: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Carola Andrea Valladares Poblete', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Solanch Quezada Morales', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Marisol Abarca Toro', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Patricia Reyes Osorio', officeName: 'Of. Com. Maipú', status: 'Atrasado' },
    { name: 'Nicole Belen Muñoz Silva', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Sixtina Rojo Astorga', officeName: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Athan Alonso Abarca Vidal', officeName: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Rosaliz Pacheco Asuaje', officeName: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Sandra Alarcon Parada', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Yaritza Huaiquinao Peñaloza', officeName: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Fabian Jesus Muñoz Ceriani', officeName: 'Of. Com. Maipú', status: 'Atrasado' },
    { name: 'Teresa del Carmen Marillanca Torres', officeName: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Karina Andrea Sobino Perez', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Marisol Cornejo Díaz', officeName: 'Of. Com. Maipú', status: 'Atrasado' },
    { name: 'Paulina Gloria Opazo Villalobos', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Nicole Martinez Escobar', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Nisnoibeth Rodriguez Nery', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Mary Cruz Oviedo De Cedeño', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Constanza Antonia Azocar Bascuñan', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Jessica Rodríguez Anríquez', officeName: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Annais Arenas Pardo', officeName: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Jocelyn de Lourdes Larenas Jimenez', officeName: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Muriel Andrea Aranguiz Lazo', officeName: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Margott Vidal Gómez', officeName: 'Of. Com. Maipú', status: 'Atrasado' },
    { name: 'Lucia Begoña Vargas Paillan', officeName: 'Of. Com. Maipú', status: 'Atrasado' },
    { name: 'Analia Adriazola Quintupill', officeName: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Oscar Boris Soto Muñoz', officeName: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Gisel Olivares Jofre', officeName: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Anchely Taborda de Ortega', officeName: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Fresia Miranda Diaz', officeName: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Jaidemarie Deutelmoser', officeName: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Isabel Margarita Riquelme Sepulveda', officeName: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Ana Belen Bascur Salas', officeName: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Consuelo del Pilar Salazar Roman', officeName: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Alexandra Rodriguez silva', officeName: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Josefa Antonia Leal Pirela', officeName: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Erika Caceres Lobos', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Reina Bueno Gateño', officeName: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Vanesa Rojas Peña', officeName: 'Of. Com. Maipú', status: 'Atrasado' },
    { name: 'Maria Angelica Valenzuela Hernandez', officeName: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Jose Luis Cañas Caicedo', officeName: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Lilian Gutiérrez Velásquez', officeName: 'Of. Com. Maipú', status: 'Atrasado' },
    { name: 'Violeta Astorga Maturana', officeName: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Jhaneilis Vera Montiel', officeName: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Valeria Irene Lizama Guzmán', officeName: 'Of. Com. Maipú', status: 'Atrasado' },
    { name: 'Flor Maria Diaz Hernandez', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Marcela Gonzalez Liempi', officeName: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Maritza Norambuena Estay', officeName: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Javiera Paz Fernandez Ramirez', officeName: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Magaly Sonia Retamal Castro', officeName: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Aida Farfan Gutierrez', officeName: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Benjamín Ignacio Martinez Mallega', officeName: 'Of. Com. Maipú', status: 'Atrasado' },
    { name: 'Camila Marillanaca', officeName: 'Of. Com. Maipú', status: 'Atrasado' },
    { name: 'Catalina Rojas Barrales', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Michelle Casanova Gutierrez', officeName: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Evelyn Robinson Mallega', officeName: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Jocelyn Alejandra Pino Pinto', officeName: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Julissa Andrea Venegas Carreño', officeName: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Fernando Hernandez', officeName: 'Sub. Gerente Helpbank', status: 'Atrasado' },
    { name: 'Christian Lezana', officeName: 'Prevencion Riesgo', status: 'Atrasado' },
];

async function seedDatabase() {
    const employeesSnapshot = await getDocs(query(employeesCollection));
    if (employeesSnapshot.empty) {
        console.log('Database is empty, seeding...');
        const batch = writeBatch(db);
        
        const officeNameToIdMap = new Map<string, string>();
        
        for (const officeData of initialOffices) {
            const officeRef = doc(officesCollection);
            batch.set(officeRef, officeData);
            officeNameToIdMap.set(officeData.name, officeRef.id);
        }

        for (const employeeData of initialEmployees) {
            const officeId = officeNameToIdMap.get(employeeData.officeName);
            if(officeId) {
                const employeeRef = doc(employeesCollection);
                const { officeName, ...restOfEmployeeData } = employeeData;
                batch.set(employeeRef, { ...restOfEmployeeData, officeId: officeId });
            } else {
                 console.warn(`Could not find office ID for office name: ${employeeData.officeName}`);
            }
        }
        
        await batch.commit();
        console.log('Database seeded successfully.');
    } else {
        console.log('Database already has data, skipping seed.');
    }
}

seedDatabase().catch(console.error);

export function slugify(text: string): string {
  if (!text) return "";
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

export const getOffices = async (): Promise<Office[]> => {
  const snapshot = await getDocs(officesCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Office));
};

export const getOfficeById = async (id: string): Promise<Office | undefined> => {
  if (!id) return undefined;
  const docRef = doc(db, 'offices', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Office;
  }
  return undefined;
};


export const getOfficeBySlug = async (slug: string): Promise<Office | undefined> => {
  const offices = await getOffices();
  return offices.find(office => slugify(office.name) === slug);
}

export const getEmployees = async (officeSlug?: string): Promise<Employee[]> => {
  if (!officeSlug || officeSlug === 'general') {
    const snapshot = await getDocs(employeesCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
  }
  
  const office = await getOfficeBySlug(officeSlug);
  if (!office) {
    return [];
  }
  
  const q = query(employeesCollection, where('officeId', '==', office.id));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
};

export const updateEmployee = async (employeeId: string, updates: Partial<Pick<Employee, 'status' | 'officeId'>>) => {
    const employeeRef = doc(db, 'employees', employeeId);
    await updateDoc(employeeRef, updates);
    const updatedDoc = await getDoc(employeeRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as Employee;
}

export const addEmployee = async (name: string, officeId: string) => {
  const newEmployee = {
    name,
    officeId,
    status: 'Atrasado', // Default status
  };
  const docRef = await addDoc(employeesCollection, newEmployee);
  return { id: docRef.id, ...newEmployee } as Employee;
};
