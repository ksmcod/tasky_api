import z from "zod";

export const createTeamSchema = z.object({
  name: z.string().nonempty({ message: "Please give a name for your team" }),
  description: z.string(),
});
