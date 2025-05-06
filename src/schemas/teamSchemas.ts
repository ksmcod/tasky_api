import z from "zod";

export const createTeamSchema = z.object({
  name: z.string().nonempty({ message: "Please give a name for your team" }),
  description: z.string().optional(),
});

export const removeMemberParamsSchema = z.object({
  member_email: z
    .string({ message: "Email is required" })
    .email({ message: "Please enter a valid email" }),
  teamCode: z.string({ message: "Please enter a team code" }).nonempty(),
});
