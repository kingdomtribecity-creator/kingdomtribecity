"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";

type ExistingQuiz = {
  title: string;
  passScorePercent: number;
  questions: {
    prompt: string;
    options: { label: string; isCorrect: boolean }[];
  }[];
};

type DraftQuestion = { prompt: string; options: string[]; correct: number };

function fromExisting(quiz?: ExistingQuiz): DraftQuestion[] {
  if (!quiz || quiz.questions.length === 0) {
    return [{ prompt: "", options: ["", ""], correct: 0 }];
  }
  return quiz.questions.map((q) => ({
    prompt: q.prompt,
    options: q.options.map((o) => o.label),
    correct: Math.max(0, q.options.findIndex((o) => o.isCorrect)),
  }));
}

export function QuizBuilder({
  action,
  quiz,
}: {
  action: (formData: FormData) => void;
  quiz?: ExistingQuiz;
}) {
  const [questions, setQuestions] = useState<DraftQuestion[]>(fromExisting(quiz));

  function updateQuestion(qi: number, patch: Partial<DraftQuestion>) {
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  }
  function updateOption(qi: number, oi: number, value: string) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) } : q
      )
    );
  }

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="quizTitle">Quiz title</Label>
          <Input id="quizTitle" name="quizTitle" defaultValue={quiz?.title} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="passScorePercent">Passing score (%)</Label>
          <Input
            id="passScorePercent"
            name="passScorePercent"
            type="number"
            min={0}
            max={100}
            defaultValue={quiz?.passScorePercent ?? 70}
          />
        </div>
      </div>

      <div className="space-y-5">
        {questions.map((q, qi) => (
          <div key={qi} className="space-y-3 rounded-md border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <Label className="flex-1">Question {qi + 1}</Label>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove question"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
            <Input
              name={`question_${qi}_prompt`}
              value={q.prompt}
              onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
              placeholder="Question prompt"
              required
            />
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`question_${qi}_correct`}
                    value={oi}
                    checked={q.correct === oi}
                    onChange={() => updateQuestion(qi, { correct: oi })}
                    className="accent-primary"
                    aria-label={`Option ${oi + 1} is correct`}
                  />
                  <Input
                    name={`question_${qi}_option_${oi}_label`}
                    value={opt}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    placeholder={`Option ${oi + 1}`}
                    className="flex-1"
                  />
                </div>
              ))}
              {q.options.length < 5 && (
                <button
                  type="button"
                  onClick={() => updateQuestion(qi, { options: [...q.options, ""] })}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  + Add option
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          setQuestions((qs) => [...qs, { prompt: "", options: ["", ""], correct: 0 }])
        }
      >
        <Plus className="size-4" /> Add question
      </Button>

      <div>
        <Button type="submit">Save quiz</Button>
      </div>
    </form>
  );
}
