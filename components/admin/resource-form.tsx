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
import { TYPE_LABEL, CATEGORY_LABEL, VISIBILITY_LABEL, LINK_ONLY_TYPES } from "@/lib/resource-labels";
import type {
  ResourceType,
  ResourceCategory,
  ResourceVisibility,
} from "@/lib/generated/prisma/enums";

type Option = { id: string; name: string };

type ExistingResource = {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  category: ResourceCategory;
  visibility: ResourceVisibility;
  tags: string[];
  published: boolean;
  externalUrl: string | null;
  coverImage: string | null;
  speakerId: string | null;
  programId: string | null;
  mediaAssetId: string | null;
  mediaAsset: { filename: string } | null;
  relatedTo: { id: string }[];
};

export function ResourceForm({
  action,
  mode,
  resource,
  speakers,
  programs,
  allResources,
  storageConfigured,
}: {
  action: (formData: FormData) => void;
  mode: "create" | "edit";
  resource?: ExistingResource;
  speakers: Option[];
  programs: Option[];
  allResources: Option[];
  storageConfigured: boolean;
}) {
  const [type, setType] = useState<ResourceType>(resource?.type ?? "ARTICLE");
  const [mediaAssetId, setMediaAssetId] = useState(resource?.mediaAssetId ?? "");
  const [mediaFilename, setMediaFilename] = useState(resource?.mediaAsset?.filename ?? "");
  const [coverImage, setCoverImage] = useState(resource?.coverImage ?? "");
  const isLinkOnly = LINK_ONLY_TYPES.includes(type);
  const relatedInitial = new Set(resource?.relatedTo.map((r) => r.id) ?? []);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={resource?.title} required />
      </div>

      {mode === "create" && (
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" required placeholder="e.g. walking-in-sonship" />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={resource?.description}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <Select name="type" value={type} onValueChange={(v) => setType(v as ResourceType)}>
            <SelectTrigger id="type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue={resource?.category ?? "SPIRITUAL_GROWTH"}>
            <SelectTrigger id="category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="visibility">Visibility</Label>
          <Select name="visibility" defaultValue={resource?.visibility ?? "PUBLIC"}>
            <SelectTrigger id="visibility" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VISIBILITY_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input id="tags" name="tags" defaultValue={resource?.tags.join(", ")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="speakerId">Speaker / Teacher</Label>
          <Select name="speakerId" defaultValue={resource?.speakerId ?? undefined}>
            <SelectTrigger id="speakerId" className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {speakers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="programId">Program connection</Label>
          <Select name="programId" defaultValue={resource?.programId ?? undefined}>
            <SelectTrigger id="programId" className="w-full">
              <SelectValue placeholder="None" />
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

      {isLinkOnly ? (
        <div className="space-y-1.5">
          <Label htmlFor="externalUrl">External / YouTube URL</Label>
          <Input
            id="externalUrl"
            name="externalUrl"
            defaultValue={resource?.externalUrl ?? ""}
            placeholder="https://..."
            required
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label>File</Label>
          <input type="hidden" name="mediaAssetId" value={mediaAssetId} />
          {mediaFilename && (
            <p className="text-sm text-muted-foreground">Current file: {mediaFilename}</p>
          )}
          <MediaUploader
            category="resources"
            storageConfigured={storageConfigured}
            label={mediaFilename ? "Replace file" : "Upload file"}
            onUploaded={(asset) => {
              setMediaAssetId(asset.id);
              setMediaFilename(asset.filename);
            }}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Cover image</Label>
        <input type="hidden" name="coverImage" value={coverImage} />
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="" className="h-24 w-40 rounded-md border border-border object-cover" />
        )}
        <MediaUploader
          category="thumbnails"
          storageConfigured={storageConfigured}
          label={coverImage ? "Replace cover image" : "Upload cover image"}
          accept="image/*"
          onUploaded={(asset) => setCoverImage(asset.url)}
        />
      </div>

      {allResources.length > 0 && (
        <div className="space-y-1.5">
          <Label>Related resources</Label>
          <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-border p-3">
            {allResources.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm">
                <Checkbox name="relatedResourceIds" value={r.id} defaultChecked={relatedInitial.has(r.id)} />
                {r.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Checkbox id="published" name="published" defaultChecked={resource?.published ?? true} />
        <Label htmlFor="published">Published</Label>
      </div>

      <Button type="submit">{mode === "create" ? "Create resource" : "Save changes"}</Button>
    </form>
  );
}
