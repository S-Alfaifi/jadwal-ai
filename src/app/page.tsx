
"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight, Linkedin } from "lucide-react";
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
      
      <main className="flex-grow flex flex-col items-center justify-center container mx-auto p-4 md:p-8">
        <div className="relative px-6 pt-14 lg:px-8">
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

        <div className="text-center max-w-2xl mx-auto mt-24 pt-12 border-t">
            <h2 className="font-headline text-3xl font-bold text-primary-foreground tracking-tight">
                About the Developer
            </h2>
            <p className="text-muted-foreground mt-4">
                I'm Sulaiman, a Computer Sciense Student, passionate about AI and building practical tools. This project is a personal experiment to make schedule planning easier and smarter for students . Built with simplicity and efficiency in mind.
            </p>
            <p className="text-xs text-muted-foreground/80 mt-4 italic">
                Note: Built with the help of AI tools as part of a learning journey in smart web development.
            </p>
            <div className="mt-6">
                 <a href="https://www.linkedin.com/in/sulaiman-alfaifi1" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon" aria-label="Connect on LinkedIn">
                        <Linkedin className="h-4 w-4" />
                    </Button>
                </a>
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
