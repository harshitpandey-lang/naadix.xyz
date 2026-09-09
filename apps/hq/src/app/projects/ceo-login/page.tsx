import { verifyCEOSession } from "@/src/lib/ceo-auth";
import { redirect } from "next/navigation";
import { CEOLoginForm } from "@/src/components/projects/ceo-login-form";

export const metadata = {
  title: "CEO Portal Login - Naadix HQ",
};

export default async function CEOLoginPage() {
  const hasSession = await verifyCEOSession();

  if (hasSession) {
    redirect("/projects");
  }

  return (
    <div className="min-h-screen bg-[var(--hq)] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <CEOLoginForm />
      </div>
    </div>
  );
}
