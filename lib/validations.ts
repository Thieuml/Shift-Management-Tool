import { z } from "zod";

// User validation schemas
export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Schedule query schema
export const scheduleQuerySchema = z.object({
  country: z.string().min(2, "Country code is required"),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "From date must be in YYYY-MM-DD format"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "To date must be in YYYY-MM-DD format"),
});

// Engineers query schema
export const engineersQuerySchema = z.object({
  country: z.string().min(2, "Country code is required"),
  sector: z.string().optional(),
  start: z.string().datetime("Start must be a valid ISO datetime"),
  end: z.string().datetime("End must be a valid ISO datetime"),
});

// Assign shift schema
export const assignShiftSchema = z.object({
  engineerId: z.string().min(1, "Engineer ID is required"),
});

// Reassign shift schema
export const reassignShiftSchema = z.object({
  engineerId: z.string().min(1, "Engineer ID is required"),
  fromEngineerId: z.string().min(1, "From engineer ID is required"),
});

// Example: Payroll validation schema
export const payrollSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  amount: z.number().positive("Amount must be positive"),
  period: z.string().min(1, "Period is required"),
});

// Example: Admin operation schema
export const adminOperationSchema = z.object({
  action: z.enum(["create", "update", "delete"]),
  resource: z.string().min(1, "Resource is required"),
  data: z.record(z.unknown()),
});
