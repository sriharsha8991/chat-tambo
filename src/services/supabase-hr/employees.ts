import { getDb, isSupabaseConfigured, Employee } from './base';
import { resolveEmployeeUuid } from './utils';

export async function getEmployee(employeeId: string): Promise<Employee | null> {
  if (!isSupabaseConfigured()) return null;
  const db = getDb();

  const { data, error } = await db
    .from('employees')
    .select('*')
    .or(`id.eq.${employeeId},employee_id.eq.${employeeId}`)
    .single();

  if (error) {
    console.error('Error fetching employee:', error);
    return null;
  }

  return data as Employee | null;
}

export async function getEmployeeByEmployeeId(employeeId: string): Promise<Employee | null> {
  if (!isSupabaseConfigured()) return null;
  const db = getDb();

  const { data, error } = await db
    .from('employees')
    .select('*')
    .eq('employee_id', employeeId)
    .single();

  if (error) {
    console.error('Error fetching employee by employee_id:', error);
    return null;
  }

  return data as Employee | null;
}

export async function getDirectReports(managerId: string): Promise<Employee[]> {
  if (!isSupabaseConfigured()) return [];

  const managerUuid = await resolveEmployeeUuid(managerId);

  const { data, error } = await getDb()
    .from('employees')
    .select('*')
    .eq('manager_id', managerUuid);

  if (error) {
    console.error('Error fetching direct reports:', error);
    return [];
  }

  return (data as Employee[]) || [];
}

export async function getAllEmployees(): Promise<Employee[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getDb()
    .from('employees')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching all employees:', error);
    return [];
  }

  return (data as Employee[]) || [];
}

/**
 * Fetch one representative employee per role (employee, manager, hr).
 * Used by PersonaContext to avoid loading the full employees table.
 */
export async function getPersonaUsers(): Promise<Employee[]> {
  if (!isSupabaseConfigured()) return [];
  const db = getDb();

  const roles = ['employee', 'manager', 'hr'] as const;
  const results: Employee[] = [];

  for (const role of roles) {
    const { data, error } = await db
      .from('employees')
      .select('*')
      .eq('role', role)
      .order('name')
      .limit(1);

    if (!error && data && data.length > 0) {
      results.push(data[0] as Employee);
    }
  }

  return results;
}
