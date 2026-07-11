"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import {
  recordTeachingViewedAction,
  submitReflectionAction,
  submitAssignmentAction,
  submitJournalAction,
  submitQuizAttemptAction,
} from "@/lib/actions/lms";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CheckCircle2, Sparkles, XCircle } from "lucide-react";

type Lesson = {
  id: string;
  title: string;
  teachingBody: string | null;
  teachingVideoUrl: string | null;
  teachingAudioUrl: string | null;
  scriptureRefs: string[];
  scriptureText: string | null;
  reflectionQuestions: string[];
  prayerPrompt?: string | null;
  assignmentPrompt: string | null;
  journalPrompt: string | null;
};

type QuizData = {
  id: string;
  title: string;
  passScorePercent: number;
  questions: { id: string; prompt: string; options: { id: string; label: string }[] }[];
} | null;

type ProgressState = {
  teachingViewedAt: Date | null;
  reflectionDoneAt: Date | null;
  assignmentDoneAt: Date | null;
  journalDoneAt: Date | null;
} | null;

const ALL_STEPS = ["teaching", "scripture", "reflect", "quiz", "assignment", "journal"] as const;
type Step = (typeof ALL_STEPS)[number];

const STEP_LABEL: Record<Step, string> = {
  teaching: "Teaching",
  scripture: "Scripture",
  reflect: "Reflection",
  quiz: "Quiz",
  assignment: "Assignment",
  journal: "Journal",
};

function initialStep(progress: ProgressState, hasQuiz: boolean): Step {
  if (!progress?.teachingViewedAt) return "teaching";
  if (!progress?.reflectionDoneAt) return "reflect";
  if (hasQuiz && !progress?.assignmentDoneAt) return "quiz";
  if (!progress?.assignmentDoneAt) return "assignment";
  if (!progress?.journalDoneAt) return "journal";
  return "journal";
}

export function LessonStepper({
  lesson,
  quiz,
  progress,
  initialAnswers,
  nextLessonHref,
  courseHref,
}: {
  lesson: Lesson;
  quiz?: QuizData;
  progress: ProgressState;
  initialAnswers: Record<string, string> | null;
  nextLessonHref: string | null;
  courseHref: string;
}) {
  const steps = useMemo(
    () => ALL_STEPS.filter((s) => s !== "quiz" || Boolean(quiz)),
    [quiz]
  );
  const isComplete = Boolean(progress?.journalDoneAt);
  const [step, setStep] = useState<Step>(initialStep(progress, Boolean(quiz)));
  const [celebrating, setCelebrating] = useState(false);
  const { update } = useSession();
  const router = useRouter();

  const stepIndex = steps.indexOf(step);

  return (
    <div>
      <ol className="flex items-center gap-2">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i <= stepIndex && setStep(s)}
              disabled={i > stepIndex}
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                i < stepIndex
                  ? "bg-growth/20 text-growth"
                  : i === stepIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
              )}
              aria-label={STEP_LABEL[s]}
            >
              {i < stepIndex ? <CheckCircle2 className="size-4" /> : i + 1}
            </button>
            {i < steps.length - 1 && <div className="h-px w-6 bg-border sm:w-10" />}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {STEP_LABEL[step]}
      </p>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {step === "teaching" && (
              <TeachingStep lesson={lesson} onNext={() => setStep("scripture")} />
            )}
            {step === "scripture" && (
              <ScriptureStep
                lesson={lesson}
                onNext={async () => {
                  await recordTeachingViewedAction(lesson.id);
                  setStep("reflect");
                }}
              />
            )}
            {step === "reflect" && (
              <ReflectStep
                lesson={lesson}
                initialAnswers={initialAnswers}
                onDone={() => setStep(quiz ? "quiz" : "assignment")}
              />
            )}
            {step === "quiz" && quiz && (
              <QuizStep quiz={quiz} onDone={() => setStep("assignment")} />
            )}
            {step === "assignment" && (
              <AssignmentStep lesson={lesson} onDone={() => setStep("journal")} />
            )}
            {step === "journal" && (
              <JournalStep
                lesson={lesson}
                alreadyComplete={isComplete}
                onDone={async (stageAdvanced) => {
                  if (stageAdvanced) {
                    // update() needs a truthy payload to actually refresh
                    // the JWT (see onboarding-form.tsx) — a no-arg call
                    // just re-reads the stale session.
                    await update({});
                    setCelebrating(true);
                  } else {
                    router.refresh();
                  }
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {isComplete && step === "journal" && !celebrating && (
        <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
          {nextLessonHref ? (
            <Button asChild>
              <a href={nextLessonHref}>Next lesson</a>
            </Button>
          ) : (
            <Button asChild>
              <a href={courseHref}>Back to course</a>
            </Button>
          )}
        </div>
      )}

      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-4 max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-xl"
            >
              <Sparkles className="mx-auto size-10 text-primary" />
              <p className="mt-4 font-heading text-2xl font-semibold">You&apos;ve grown.</p>
              <p className="mt-2 text-muted-foreground">
                You&apos;ve completed this stage and stepped into the next
                part of your journey.
              </p>
              <Button className="mt-6 w-full" onClick={() => router.push("/dashboard")}>
                See your growth
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TeachingStep({ lesson, onNext }: { lesson: Lesson; onNext: () => void }) {
  return (
    <div className="space-y-4">
      {lesson.teachingVideoUrl && (
        <div className="aspect-video overflow-hidden rounded-lg bg-secondary">
          <iframe
            src={lesson.teachingVideoUrl}
            className="h-full w-full"
            allow="autoplay; fullscreen"
          />
        </div>
      )}
      {lesson.teachingBody && (
        <p className="text-lg leading-relaxed text-muted-foreground">{lesson.teachingBody}</p>
      )}
      <Button onClick={onNext}>Continue to Scripture</Button>
    </div>
  );
}

function ScriptureStep({
  lesson,
  onNext,
}: {
  lesson: Lesson;
  onNext: () => void | Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  return (
    <div className="space-y-4">
      <blockquote className="rounded-lg border-l-4 border-primary bg-secondary/40 p-6 font-heading text-xl leading-relaxed">
        {lesson.scriptureText}
      </blockquote>
      {lesson.scriptureRefs.length > 0 && (
        <p className="text-sm text-muted-foreground">{lesson.scriptureRefs.join(" · ")}</p>
      )}
      <Button
        disabled={pending}
        onClick={async () => {
          setPending(true);
          await onNext();
        }}
      >
        {pending ? "Saving…" : "I've meditated on this"}
      </Button>
    </div>
  );
}

function ReflectStep({
  lesson,
  initialAnswers,
  onDone,
}: {
  lesson: Lesson;
  initialAnswers: Record<string, string> | null;
  onDone: () => void;
}) {
  const boundAction = useMemo(
    () => submitReflectionAction.bind(null, lesson.id),
    [lesson.id]
  );
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  useEffect(() => {
    if (state?.success) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      {lesson.reflectionQuestions.map((q) => (
        <div key={q} className="space-y-2">
          <Label>{q}</Label>
          <Textarea
            name="answer"
            rows={3}
            required
            defaultValue={initialAnswers?.[q] ?? ""}
            placeholder="Write honestly — there's no wrong answer."
          />
        </div>
      ))}
      {lesson.prayerPrompt && (
        <div className="rounded-lg border-l-4 border-growth bg-growth/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-growth">
            Prayer exercise
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{lesson.prayerPrompt}</p>
        </div>
      )}
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}

function QuizStep({
  quiz,
  onDone,
}: {
  quiz: NonNullable<QuizData>;
  onDone: () => void;
}) {
  const boundAction = useMemo(() => submitQuizAttemptAction.bind(null, quiz.id), [quiz.id]);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  if (state?.success) {
    return (
      <div className="space-y-4">
        <p
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            state.passed ? "text-growth" : "text-destructive"
          )}
        >
          {state.passed ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {state.passed ? "You passed!" : "Not quite — you can continue and revisit this later."}
        </p>
        <p className="text-sm text-muted-foreground">
          Score: {state.scorePercent}% (passing score: {quiz.passScorePercent}%)
        </p>
        <Button onClick={onDone}>Continue to Assignment</Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <p className="font-heading text-lg font-medium">{quiz.title}</p>
      {quiz.questions.map((q, qi) => (
        <div key={q.id} className="space-y-2">
          <Label>
            {qi + 1}. {q.prompt}
          </Label>
          <div className="space-y-1.5">
            {q.options.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2 rounded-md border border-input p-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name={`question_${q.id}`}
                  value={opt.id}
                  required
                  className="accent-primary"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      ))}
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Grading…" : "Submit quiz"}
      </Button>
    </form>
  );
}

function AssignmentStep({ lesson, onDone }: { lesson: Lesson; onDone: () => void }) {
  const [checked, setChecked] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-5">
      <p className="text-lg leading-relaxed text-muted-foreground">{lesson.assignmentPrompt}</p>
      <label className="flex items-center gap-3 text-sm">
        <Checkbox checked={checked} onCheckedChange={(v) => setChecked(Boolean(v))} />
        I completed this assignment
      </label>
      <Button
        disabled={!checked || pending}
        onClick={async () => {
          setPending(true);
          await submitAssignmentAction(lesson.id);
          onDone();
        }}
      >
        {pending ? "Saving…" : "Continue to Journal"}
      </Button>
    </div>
  );
}

function JournalStep({
  lesson,
  alreadyComplete,
  onDone,
}: {
  lesson: Lesson;
  alreadyComplete: boolean;
  onDone: (stageAdvanced: boolean) => void;
}) {
  const boundAction = useMemo(
    () => submitJournalAction.bind(null, lesson.id),
    [lesson.id]
  );
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  useEffect(() => {
    if (state?.success) onDone(Boolean(state.stageAdvanced));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (alreadyComplete && !state?.success) {
    return (
      <div className="space-y-4">
        <p className="flex items-center gap-2 text-sm font-medium text-growth">
          <CheckCircle2 className="size-4" /> Lesson complete
        </p>
        <p className="text-muted-foreground">{lesson.journalPrompt}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <p className="text-lg leading-relaxed text-muted-foreground">{lesson.journalPrompt}</p>
      <Textarea
        name="content"
        rows={5}
        required
        placeholder="Journal your thoughts..."
      />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Complete lesson"}
      </Button>
    </form>
  );
}
