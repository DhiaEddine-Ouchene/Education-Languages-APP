"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Edit, Trash2, Eye, Loader2 } from "lucide-react";

type CourseRow = {
  id: string;
  title: string;
  description: string;
  language: string;
  level: string;
  coverImage: string | null;
  isPublished: boolean;
  _count: { lessons: true; games?: true };
};

type Props = {
  courses: CourseRow[];
};

export function CoursesGridClient({ courses }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (courseId: string, title: string) => {
    if (deleteConfirm !== courseId) {
      setDeleteConfirm(courseId);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    setDeleting((prev) => ({ ...prev, [courseId]: true }));
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast("error", data.error || "Failed to delete course");
        return;
      }

      toast("success", `"${title}" deleted`);
      router.refresh();
    } catch (err: any) {
      toast("error", err.message || "Failed to delete course");
    } finally {
      setDeleting((prev) => ({ ...prev, [courseId]: false }));
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.map((c) => (
        <Card key={c.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
          {/* Course Preview Image */}
          <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-card flex items-center justify-center text-5xl relative overflow-hidden">
            {c.coverImage ? (
              <img src={c.coverImage} alt={c.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl">📚</span>
            )}
            <Badge
              variant={c.isPublished ? "accent" : "outline"}
              className={cn(
                "absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5",
                c.isPublished && "bg-green-100 text-green-700 border-green-200"
              )}
            >
              {c.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>

          <CardContent className="pt-3 pb-4 flex-1 flex flex-col">
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-base mb-1 line-clamp-2">{c.title}</h3>
              <p className="text-xs text-txt-secondary line-clamp-2 mb-2">{c.description}</p>
              <div className="flex items-center gap-2 text-xs text-txt-secondary">
                <span className="font-medium">{c.language}</span>
                <span>·</span>
                <span>{c.level}</span>
                <span>·</span>
                <span>{c._count.lessons} lessons</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
              <Link href={`/dashboard/courses/${c.id}/preview`} className="flex-1">
                <Button size="sm" variant="outline" className="w-full">
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Preview
                </Button>
              </Link>
              <Link href={`/dashboard/courses/${c.id}`} className="flex-1">
                <Button size="sm" variant="primary" className="w-full">
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(c.id, c.title)}
                disabled={deleting[c.id]}
                className={cn(
                  "px-2",
                  deleteConfirm === c.id
                    ? "text-error hover:bg-error/20 border border-error"
                    : "text-txt-secondary hover:text-error hover:bg-error/10"
                )}
                title={deleteConfirm === c.id ? "Click again to confirm deletion" : "Delete course"}
              >
                {deleting[c.id] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
