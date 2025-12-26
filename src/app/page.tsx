import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("deora-auth-token")?.value;

  if (token) {
    try {
      const JWT_SECRET = new TextEncoder().encode(
        process.env.JWT_SECRET || "deora-plaza-secret-key-change-in-production"
      );

      // Verify the token
      await jwtVerify(token, JWT_SECRET);

      // If valid, go to dashboard
      redirect("/dashboard");
    } catch (error) {
      // If invalid, go to login
      redirect("/login");
    }
  } else {
    // If no token, go to login
    redirect("/login");
  }

  // This part is unreachable, but satisfies TS
  return null;
}