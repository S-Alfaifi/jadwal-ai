import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface AiSuggestionsProps {
  suggestions: string[];
}

export function AiSuggestions({ suggestions }: AiSuggestionsProps) {
  return (
    <Card className="mt-8 bg-secondary/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Lightbulb className="h-6 w-6 text-primary" />
          <CardTitle className="text-2xl font-headline">AI-Powered Suggestions</CardTitle>
        </div>
        <CardDescription>
          We couldn't find a conflict-free schedule. Here are some suggestions to make things work:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 list-disc pl-5">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="text-muted-foreground text-base">
              {suggestion}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
