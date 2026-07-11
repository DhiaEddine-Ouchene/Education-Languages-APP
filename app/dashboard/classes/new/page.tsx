"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

const schema = z.object({
  name: z.string().min(2, "Class name is required"),
  language: z.string().min(2),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
});
type FormData = z.infer<typeof schema>;

export default function NewClassPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { language: "Spanish", level: "A1" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) return toast("error", "Failed to create class");
      const cls = await res.json();
      toast("success", `Class created! Invite code: ${cls.inviteCode}`);
      router.push(`/dashboard/classes/${cls.id}`);
      router.refresh();
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md space-y-6">
      <h1 className="font-heading font-bold text-2xl">Create class</h1>
      <Card><CardContent className="pt-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><Label>Class name</Label><Input placeholder="Spanish 101" {...register("name")} /><FieldError message={errors.name?.message} /></div>
          <div><Label>Language</Label><Select {...register("language")}>{["Spanish", "French", "German", "English", "Italian", "Japanese"].map((l) => <option key={l}>{l}</option>)}</Select></div>
          <div><Label>Level</Label><Select {...register("level")}>{["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => <option key={l}>{l}</option>)}</Select></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating..." : "Create class"}</Button>
        </form>
      </CardContent></Card>
    </div>
  );
}
