import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Clock, CalendarDays, BookText } from "lucide-react";
import type { Course } from "@/lib/types";

interface CourseCardProps {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
}

export function CourseCard({ course, onEdit, onDelete }: CourseCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-start bg-muted/50">
        <div className="flex-grow">
          <CardTitle className="flex items-center gap-3">
             <div className="w-4 h-4 rounded-full" style={{ backgroundColor: course.color }} />
            {course.name}
          </CardTitle>
          <CardDescription className="mt-1">{course.sections.length} section(s) available</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit course ${course.name}`}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label={`Delete course ${course.name}`}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-sm">
        <div className="space-y-4">
          {course.sections.map((section, index) => (
            <div key={section.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-md border bg-background">
              <div className="font-medium text-primary-foreground flex items-center gap-2">
                <BookText className="h-4 w-4 text-muted-foreground" />
                Section {index + 1} ({section.type})
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <div className="flex gap-1.5">
                  {section.days.map(day => (
                    <Badge key={day} variant="secondary" className="font-mono">{day}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="font-mono">{section.startTime} - {section.endTime}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
