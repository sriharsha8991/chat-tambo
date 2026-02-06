import type { Employee } from './base';
import { getEmployee, getEmployeeByEmployeeId } from './employees';

export async function resolveEmployeeUuid(employeeId: string): Promise<string> {
  if (!employeeId.includes('-') || employeeId.startsWith('ZP-')) {
    const employee = await getEmployeeByEmployeeId(employeeId);
    return employee?.id ?? employeeId;
  }

  return employeeId;
}

export async function resolveEmployee(employeeId: string): Promise<Employee | null> {
  if (!employeeId.includes('-') || employeeId.startsWith('ZP-')) {
    return getEmployeeByEmployeeId(employeeId);
  }

  return getEmployee(employeeId);
}
