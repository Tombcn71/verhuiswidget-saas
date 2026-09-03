import type { Metadata } from "next";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = { title: "Account aanmaken" };

export default function SignUpPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-50 px-6 py-16">
      <Link href="/" className="mb-8 text-lg font-bold tracking-tight">
        Verhuis<span className="text-brand-600">Widget</span>
      </Link>
      <SignUp />
    </div>
  );
}
