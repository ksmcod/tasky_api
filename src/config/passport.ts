import { Strategy as GithubStrategy } from "passport-github2";
import { PassportStatic } from "passport";
import db from "../lib/db";
import { createToken } from "../utils/createToken";

export const githubStrategy = (passport: PassportStatic) => {
  passport.use(
    new GithubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        callbackURL: `${process.env.SERVER_URL as string}/auth/github/callback`,
        scope: ["user:email"],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: any
      ) => {
        try {
          //   console.log("PROFILE IS: ", profile);

          // Check if email is already registerd
          let user = await db.user.findUnique({
            where: { email: profile.emails[0].value },
          });

          if (user && user.password) {
            // console.log("GITHUB AUTH: Email already registerd");
            throw new Error("Email already registered");
          }

          // If user does not exist, create a new user
          if (!user) {
            user = await db.user.create({
              data: {
                name: profile.displayName,
                email: profile.emails[0].value,
                image: profile.photos[0].value,
                provider: "github",
                providerId: profile.id,
              },
            });
          }

          // Generate token
          const token = createToken({ userId: user.id });
          //   console.log("User: ", user, "\nToken: ", token);
          done(null, { user, token });
        } catch (error) {
          console.log("Error in passport config: ", error);
          done(error, null);
        }
      }
    )
  );
};
