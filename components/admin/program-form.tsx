"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaUploader } from "@/components/admin/media-uploader";

type ExistingProgram = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  visionBody: string | null;
  heroImage: string | null;
  published: boolean;
  featuredCourseId: string | null;
};

export function ProgramForm({
  action,
  mode,
  program,
  storageConfigured,
  ownCourses,
}: {
  action: (formData: FormData) => void;
  mode: "create" | "edit";
  program?: ExistingProgram;
  storageConfigured: boolean;
  ownCourses?: { id: string; title: string }[];
}) {
  const [heroImage, setHeroImage] = useState(program?.heroImage ?? "");

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={program?.name} required />
      </div>

      {mode === "create" && (
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" required placeholder="e.g. school-of-prayer" />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="tagline">Tagline</Label>
        <Input id="tagline" name="tagline" defaultValue={program?.tagline} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description (Overview)</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={program?.description}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="visionBody">Vision</Label>
        <Textarea
          id="visionBody"
          name="visionBody"
          rows={3}
          defaultValue={program?.visionBody ?? ""}
          placeholder="The narrative shown on this Expression's Hub page — falls back to the tagline if left blank."
        />
      </div>

      {mode === "edit" && (
        <div className="space-y-1.5">
          <Label htmlFor="featuredCourseId">Featured course</Label>
          <Select name="featuredCourseId" defaultValue={program?.featuredCourseId ?? undefined}>
            <SelectTrigger id="featuredCourseId" className="w-full">
              <SelectValue placeholder="First published course (default)" />
            </SelectTrigger>
            <SelectContent>
              {(ownCourses ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Hero image</Label>
        <input type="hidden" name="heroImage" value={heroImage} />
        {heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImage} alt="" className="h-24 w-40 rounded-md border border-border object-cover" />
        )}
        <MediaUploader
          category="programs"
          storageConfigured={storageConfigured}
          accept="image/*"
          label={heroImage ? "Replace hero image" : "Upload hero image"}
          onUploaded={(asset) => setHeroImage(asset.url)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="published" name="published" defaultChecked={program?.published ?? true} />
        <Label htmlFor="published">Published</Label>
      </div>

      <Button type="submit">{mode === "create" ? "Create program" : "Save changes"}</Button>
    </form>
  );
}
