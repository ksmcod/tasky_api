// An interface that defines the return type of an array of teams a user belongs to

import { TeamRole } from "../generated/prisma";

// To be used in the 'getAllTeams' controller function
export interface AllTeamsReturnType {
  name: string;
  description?: string;
  joinCode: string;
  createdAt: Date;
  joinedAt: Date;
  role: TeamRole;
}
