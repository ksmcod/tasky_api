// This function creates a JWT token for the user with the given userId.
import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
}

export function createToken(payload: TokenPayload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "60d",
  });
  return token;
}
