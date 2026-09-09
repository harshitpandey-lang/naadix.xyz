import { LogOut } from "lucide-react";
import { signOut } from "@/src/app/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#b8c5c7] transition hover:bg-white/5 hover:text-white">
        <LogOut size={16} />
        Sign out
      </button>
    </form>
  );
}
