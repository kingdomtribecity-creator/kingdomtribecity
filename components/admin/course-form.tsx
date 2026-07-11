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
import { STAGE_ORDER, STAGE_META } from "@/lib/stage";
import type {
  CourseStatus,
  CourseDifficulty,
  CourseFormat,
  CourseAccessLevel,
  PricingType,
} from "@/lib/generated/prisma/enums";

const STATUS_LABEL: Record<CourseStatus, string> = {
  DRAFT: "Draft",
  REVIEW: "Review",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};
const DIFFICULTY_LABEL: Record<CourseDifficulty, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};
const FORMAT_LABEL: Record<CourseFormat, string> = {
  SELF_PACED: "Self-paced",
  COHORT_BASED: "Cohort-based",
  CHALLENGE: "Challenge",
  INTENSIVE: "Intensive",
  CERTIFICATION: "Certification program",
};

type Option = { id: string; name: string };

type ExistingCourse = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  stage: string | null;
  category: string | null;
  difficulty: CourseDifficulty | null;
  durationLabel: string | null;
  startDate: Date | null;
  endDate: Date | null;
  format: CourseFormat;
  accessLevel: CourseAccessLevel;
  pricingType: PricingType;
  priceCents: number | null;
  certificateEnabled: boolean;
  status: CourseStatus;
  coverImage: string | null;
  authorId: string | null;
  mentors: { userId: string }[];
};

function dateInputValue(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export function CourseForm({
  action,
  mode,
  course,
  programs,
  people,
  canReassignAuthor,
  storageConfigured,
}: {
  action: (formData: FormData) => void;
  mode: "create" | "edit";
  course?: ExistingCourse;
  programs: Option[];
  people: Option[];
  canReassignAuthor: boolean;
  storageConfigured: boolean;
}) {
  const [coverImage, setCoverImage] = useState(course?.coverImage ?? "");
  const [pricingType, setPricingType] = useState<PricingType>(course?.pricingType ?? "FREE");
  const mentorInitial = new Set(course?.mentors.map((m) => m.userId) ?? []);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={course?.title} required />
      </div>

      {mode === "create" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" required placeholder="e.g. school-of-prayer-101" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="programId">Program</Label>
            <Select name="programId" required>
              <SelectTrigger id="programId" className="w-full">
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="subtitle">Subtitle</Label>
        <Input id="subtitle" name="subtitle" defaultValue={course?.subtitle ?? ""} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={course?.description}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" defaultValue={course?.category ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select name="difficulty" defaultValue={course?.difficulty ?? undefined}>
            <SelectTrigger id="difficulty" className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DIFFICULTY_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="durationLabel">Duration</Label>
          <Input
            id="durationLabel"
            name="durationLabel"
            placeholder="e.g. 12 weeks, Self-paced"
            defaultValue={course?.durationLabel ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stage">Stage (optional coarse hint)</Label>
          <Select name="stage" defaultValue={course?.stage ?? undefined}>
            <SelectTrigger id="stage" className="w-full">
              <SelectValue placeholder="Spans multiple stages" />
            </SelectTrigger>
            <SelectContent>
              {STAGE_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STAGE_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={dateInputValue(course?.startDate ?? null)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">End date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={dateInputValue(course?.endDate ?? null)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="format">Format</Label>
          <Select name="format" defaultValue={course?.format ?? "SELF_PACED"}>
            <SelectTrigger id="format" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FORMAT_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="accessLevel">Access</Label>
          <Select name="accessLevel" defaultValue={course?.accessLevel ?? "PUBLIC"}>
            <SelectTrigger id="accessLevel" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">Public</SelectItem>
              <SelectItem value="PRIVATE">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={course?.status ?? "DRAFT"}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pricingType">Pricing</Label>
          <Select
            name="pricingType"
            value={pricingType}
            onValueChange={(v) => setPricingType(v as PricingType)}
          >
            <SelectTrigger id="pricingType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FREE">Free</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {pricingType === "PAID" && (
          <div className="space-y-1.5">
            <Label htmlFor="priceDollars">Price (USD)</Label>
            <Input
              id="priceDollars"
              name="priceDollars"
              type="number"
              min={1}
              step={1}
              defaultValue={course?.priceCents ? course.priceCents / 100 : ""}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="certificateEnabled"
          name="certificateEnabled"
          defaultChecked={course?.certificateEnabled ?? true}
        />
        <Label htmlFor="certificateEnabled">Issue a certificate on completion</Label>
      </div>

      <div className="space-y-1.5">
        <Label>Cover image</Label>
        <input type="hidden" name="coverImage" value={coverImage} />
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="" className="h-24 w-40 rounded-md border border-border object-cover" />
        )}
        <MediaUploader
          category="courses"
          storageConfigured={storageConfigured}
          accept="image/*"
          label={coverImage ? "Replace cover image" : "Upload cover image"}
          onUploaded={(asset) => setCoverImage(asset.url)}
        />
      </div>

      {canReassignAuthor && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="authorId">Instructor</Label>
            <Select name="authorId" defaultValue={course?.authorId ?? undefined}>
              <SelectTrigger id="authorId" className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {people.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Mentors</Label>
            <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-border p-3">
              {people.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <Checkbox name="mentorIds" value={p.id} defaultChecked={mentorInitial.has(p.id)} />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <Button type="submit">{mode === "create" ? "Create course" : "Save changes"}</Button>
    </form>
  );
}
