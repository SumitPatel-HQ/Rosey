import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Mail,
  Zap,
  GitBranch,
  BarChart3,
  ArrowRight,
  Inbox,
  Users,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-border/60 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Image src="/rose_logo.png" alt="Rosey" width={28} height={28} />
            <span className="font-semibold text-lg tracking-tight">Rosey</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {userId ? (
              <Button size="sm" asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </SignInButton>
                <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
                  <Button size="sm">Get started</Button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[700px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            AI-powered B2B outreach automation
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
            Turn cold leads into{" "}
            <span className="bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
              warm conversations
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Build visual email workflows, enroll leads automatically, and let Rosey send
            personalised AI-written emails — branching on replies, following up on silence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
              <Button size="lg" className="gap-2 text-base px-8">
                Start for free <ArrowRight className="h-4 w-4" />
              </Button>
            </SignUpButton>
            <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
              <Button size="lg" variant="outline" className="text-base px-8">
                Sign in
              </Button>
            </SignInButton>
          </div>
        </div>
      </section>

      {/* ── Feature strip ──────────────────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-muted/20 py-10 px-6">
        <div className="container mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { icon: GitBranch, label: "Visual Workflow Builder" },
            { icon: Mail,      label: "AI-Generated Emails"    },
            { icon: Inbox,     label: "Unified Gmail Inbox"    },
            { icon: BarChart3, label: "Campaign Analytics"     },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted border border-border/60">
                <Icon className="h-5 w-5" />
              </div>
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-4">How Rosey works</h2>
          <p className="text-center text-muted-foreground mb-14">From leads to replies in four simple steps.</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { step: "01", icon: Users,     title: "Import your leads",      desc: "Upload a CSV or add leads manually. Rosey stores name, company, industry, and tags."                                             },
              { step: "02", icon: GitBranch, title: "Design a workflow",      desc: "Drag-and-drop send, wait, and condition nodes to build multi-step sequences visually."                                           },
              { step: "03", icon: Zap,       title: "Activate the campaign",  desc: "Hit Run and Rosey enrolls every lead, generates personalised emails, and sends them via Gmail."                                 },
              { step: "04", icon: Clock,     title: "Rosey handles the rest", desc: "Reply detection, follow-ups, and branching all happen automatically in the background."                                          },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="rounded-xl border border-border/60 bg-card p-6 flex gap-4">
                <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">{step}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-muted/20 border-y border-border/60">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-14">Everything you need to close more deals</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Mail,         color: "text-blue-500   bg-blue-500/10",   title: "AI-personalised emails",  desc: "GPT-powered copy tailored to each lead's name, company, and industry."              },
              { icon: GitBranch,   color: "text-purple-500 bg-purple-500/10", title: "Smart reply branching",    desc: "Detects replies automatically and routes leads down different paths."                },
              { icon: Clock,        color: "text-amber-500  bg-amber-500/10",  title: "Timed follow-ups",         desc: "Schedule waits in seconds, minutes, hours, or days between steps."                  },
              { icon: Inbox,        color: "text-green-500  bg-green-500/10",  title: "Unified inbox",            desc: "Read, reply, or use AI-assist to craft responses inside Rosey."                    },
              { icon: BarChart3,    color: "text-rose-500   bg-rose-500/10",   title: "Campaign analytics",       desc: "Track emails sent, replies, follow-ups, and completion rate at a glance."          },
              { icon: CheckCircle2, color: "text-teal-500   bg-teal-500/10",   title: "Gmail native",             desc: "Sends via your own Gmail account with real threading — not a no-reply address."    },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="rounded-xl border border-border/60 bg-card p-5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg mb-3 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Ready to automate your outreach?</h2>
          <p className="text-muted-foreground mb-8">Sign up for free and launch your first campaign in minutes.</p>
          <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
            <Button size="lg" className="gap-2 text-base px-10">
              Get started for free <ArrowRight className="h-4 w-4" />
            </Button>
          </SignUpButton>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 py-6 px-6 mt-auto">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Image src="/rose_logo.png" alt="Rosey" width={20} height={20} />
            <span>Rosey — AI outreach automation</span>
          </div>
          <span>© {new Date().getFullYear()} Rosey. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
