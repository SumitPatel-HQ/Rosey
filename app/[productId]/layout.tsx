"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ProductSelector } from "@/components/product-selector";
import { CampaignSelector } from "@/components/campaign-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { Users, Megaphone } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

const navItems = [
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Leads List", href: "/leads", icon: Users },
];

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const productId = params.productId as string;

  // Hide sidebar when inside a campaign detail (campaignId segment present)
  const isCampaignDetail = /\/campaigns\/[^/]/.test(pathname);

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      <header className="border-b bg-background z-50 shrink-0">
        <div className="flex h-14 items-center justify-between px-3 sm:px-6 gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <Image src="/rose_logo.png" alt="Rosey" width={28} height={28} />
            <span className="font-semibold text-lg hidden sm:inline">Rosey</span>
          </Link>
          
          <div className="flex flex-1 items-center justify-center sm:justify-start gap-2 min-w-0">
            <Separator orientation="vertical" className="h-6 hidden sm:block mr-2" />
            <div className="min-w-0 flex-1 sm:flex-none flex justify-end sm:justify-start">
              <ProductSelector />
            </div>
            <div className="min-w-0 flex-1 sm:flex-none flex justify-start">
              <CampaignSelector />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop sidebar — hidden on mobile */}
        {!isCampaignDetail && (
          <aside className="hidden md:block w-56 border-r bg-muted/30 p-4 shrink-0">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const fullHref = `/${productId}${item.href}`;
                const isActive = pathname.startsWith(fullHref);

                return (
                  <Link
                    key={item.href}
                    href={fullHref}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        <main className={cn("flex-1 min-h-0 overflow-hidden flex flex-col", !isCampaignDetail && "p-3 sm:p-6")}>
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation — visible on mobile only, hidden in campaign detail */}
      {!isCampaignDetail && (
        <nav className="md:hidden flex items-center justify-around border-t bg-background shrink-0 h-16 px-4">
          {navItems.map((item) => {
            const fullHref = `/${productId}${item.href}`;
            const isActive = pathname.startsWith(fullHref);

            return (
              <Link
                key={item.href}
                href={fullHref}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium transition-colors min-w-[64px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
