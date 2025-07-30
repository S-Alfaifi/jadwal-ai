
"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
       <header className="py-6 px-4 md:px-8 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
            <Logo />
            <div className="flex items-center gap-2">
                <ThemeToggle />
            </div>
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center container mx-auto p-4 md:p-8">
        <div className="relative isolate px-6 pt-14 lg:px-8">
            <div
              className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
              aria-hidden="true"
            >
              <div
                className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#a2d2ff] to-[#cdb4db] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                style={{
                  clipPath:
                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                }}
              />
            </div>
          <div className="text-center">
            <h1 className="font-headline text-4xl md:text-6xl font-bold text-primary-foreground tracking-tight">
              The smart way to build your university schedule
            </h1>
            <p className="text-muted-foreground mt-6 max-w-2xl mx-auto text-lg leading-8">
              Jadwal.Ai helps you generate conflict-free class schedules in seconds. Add your courses, select your sections, and let us handle the rest.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button size="lg" onClick={() => router.push('/editor')}>
                    Create Your Schedule <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          © 2025 Sulaiman Alfaifi — All rights reserved
        </p>
      </footer>
    </div>
  );
}
