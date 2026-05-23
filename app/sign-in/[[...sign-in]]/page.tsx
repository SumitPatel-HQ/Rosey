import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignInPage() {
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
              Rosey access
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Sign in to continue building.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-[var(--text-secondary)]">
              Return to your dashboard, manage products, and keep your outreach
              automation moving without breaking flow.
            </p>
          </section>

          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <SignIn
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              forceRedirectUrl="/dashboard"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
