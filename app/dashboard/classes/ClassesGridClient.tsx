"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { EmptyState } from "@/components/shared/EmptyState";
import { Plus, Users, Trash2, Loader2, Copy, AlertTriangle, X } from "lucide-react";

type ClassRow = {
  id: string;
  name: string;
  language: string;
  level: string;
  inviteCode: string;
  createdAt: Date | string;
  _count: { members: number };
};

type Props = {
  classes: ClassRow[];
};

export function ClassesGridClient({ classes }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [classToDelete, setClassToDelete] = useState<ClassRow | null>(null);

  const handleDelete = async () => {
    if (!classToDelete) return;
    const cid = classToDelete.id;
    const name = classToDelete.name;

    setDeletingId(cid);
    try {
      const res = await fetch(`/api/classes/${cid}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast("error", data.error || "Failed to delete class");
        return;
      }

      toast("success", `Class "${name}" deleted`);
      setClassToDelete(null);
      router.refresh();
    } catch (err: any) {
      toast("error", err.message || "Failed to delete class");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 bg-background border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2 text-error font-heading font-bold text-lg">
                <AlertTriangle className="h-5 w-5" />
                <span>Delete Class</span>
              </div>
              <button
                onClick={() => !deletingId && setClassToDelete(null)}
                disabled={Boolean(deletingId)}
                className="p-1 rounded-full text-txt-secondary hover:bg-border transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-sm text-txt-primary">
                Are you sure you want to delete <span className="font-semibold text-txt-primary">"{classToDelete.name}"</span>?
              </p>
              <p className="text-xs text-txt-secondary leading-relaxed">
                This action is permanent and cannot be undone. All student memberships, progress records, and class assignments will be deleted.
              </p>
            </div>

            <div className="p-4 bg-background border-t border-border flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setClassToDelete(null)}
                disabled={Boolean(deletingId)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDelete}
                disabled={Boolean(deletingId)}
                className="bg-error hover:bg-error/90 text-white border-none"
              >
                {deletingId ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1.5" /> Delete Class
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl">Classes</h1>
          <p className="text-xs text-txt-secondary mt-0.5">{classes.length} total classes</p>
        </div>
        <Link href="/dashboard/classes/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> New class
          </Button>
        </Link>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          title="No classes yet"
          description="Create a class and share the invite code with students."
          ctaLabel="Create class"
          ctaHref="/dashboard/classes/new"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow flex flex-col">
              <CardContent className="pt-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2 text-primary">
                      <Users className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">{c.language}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(c.inviteCode);
                        toast("success", "Invite code copied");
                      }}
                      className="cursor-pointer group flex items-center gap-1"
                      title="Click to copy invite code"
                    >
                      <Badge variant="outline" className="group-hover:border-primary group-hover:text-primary transition-colors text-[11px]">
                        <Copy className="h-3 w-3 mr-1 opacity-70" />
                        Code: {c.inviteCode}
                      </Badge>
                    </button>
                  </div>
                  <h3 className="font-heading font-semibold text-base mb-1">{c.name}</h3>
                  <p className="text-xs text-txt-secondary mb-4">
                    {c.level} · {c._count.members} student{c._count.members === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <Link href={`/dashboard/classes/${c.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      Manage
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setClassToDelete(c)}
                    disabled={deletingId === c.id}
                    className="text-txt-secondary hover:text-error hover:bg-error/10 px-2.5"
                    title="Delete class"
                  >
                    {deletingId === c.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-error" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
