import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-6 py-16 text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_0.95fr]">
          <section className="max-w-xl">
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-[var(--text-secondary)]">
              Create your account
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Start with a dashboard ready to go.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-[var(--text-secondary)]">
              Create your account, land in the dashboard automatically, and keep
              your session flow consistent across every visit.
            </p>
          </section>

          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              forceRedirectUrl="/dashboard"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
