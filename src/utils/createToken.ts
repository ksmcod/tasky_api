// This function creates a JWT token for the user with the given userId.
import jwt from "jsonwebtoken";

export function createToken(userId: string) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: "60d",
  });
  return token;
}
