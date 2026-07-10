"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { postDiscussionAction, postCommentAction } from "@/lib/actions/community";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Comment = {
  id: string;
  body: string;
  createdAt: Date;
  user: { name: string | null };
};

type Post = {
  id: string;
  body: string;
  createdAt: Date;
  user: { name: string | null };
  comments: Comment[];
};

function initials(name: string | null) {
  if (!name) return "KTC";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function DiscussionThread({ tribeSlug, posts }: { tribeSlug: string; posts: Post[] }) {
  const boundPost = postDiscussionAction.bind(null, tribeSlug);
  const [state, formAction, pending] = useActionState(boundPost, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.error) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-6">
      <form ref={formRef} action={formAction} className="space-y-2">
        <Textarea name="body" rows={3} required placeholder="Share something with your Tribe..." />
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Posting…" : "Post"}
        </Button>
      </form>

      <div className="space-y-5">
        {posts.map((post) => (
          <DiscussionPostItem key={post.id} post={post} tribeSlug={tribeSlug} />
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">No discussions yet — be the first to share.</p>
        )}
      </div>
    </div>
  );
}

function DiscussionPostItem({ post, tribeSlug }: { post: Post; tribeSlug: string }) {
  const [showReply, setShowReply] = useState(false);
  const boundComment = postCommentAction.bind(null, post.id, tribeSlug);
  const [state, formAction, pending] = useActionState(boundComment, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.error) formRef.current?.reset();
  }, [state]);

  return (
    <div className="rounded-lg border border-border/60 p-4">
      <div className="flex gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">{initials(post.user.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{post.user.name}</p>
          <p className="mt-1 text-sm leading-relaxed">{post.body}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {post.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </p>

          {post.comments.length > 0 && (
            <div className="mt-3 space-y-3 border-l border-border pl-4">
              {post.comments.map((c) => (
                <div key={c.id}>
                  <p className="text-xs font-medium">{c.user.name}</p>
                  <p className="text-sm text-muted-foreground">{c.body}</p>
                </div>
              ))}
            </div>
          )}

          {showReply ? (
            <form ref={formRef} action={formAction} className="mt-3 space-y-2">
              <Textarea name="body" rows={2} required placeholder="Reply..." />
              {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
              <Button type="submit" size="sm" variant="outline" disabled={pending}>
                {pending ? "Replying…" : "Reply"}
              </Button>
            </form>
          ) : (
            <button
              onClick={() => setShowReply(true)}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground"
            >
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
