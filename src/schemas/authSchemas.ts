import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().nonempty({ message: "Please fill all fields" }),
  lastName: z.string().nonempty({ message: "Please fill all fields" }),
  email: z.string().email().nonempty({ message: "Please fill all fields" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

export const loginSchema = z.object({
  email: z.string().email().nonempty({ message: "Please fill all fields" }),
  password: z.string().nonempty({ message: "Please fill all fields" }),
});
