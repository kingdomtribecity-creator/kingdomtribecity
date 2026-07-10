import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export const onboardingSchema = z.object({
  sphereOfInfluence: z.string().trim().min(1, "Choose a sphere of influence."),
  bio: z.string().trim().max(500).optional(),
});

export const reflectionSchema = z.object({
  lessonId: z.string().cuid(),
  answers: z.array(z.string().trim().min(1)).min(1),
});

export const journalSchema = z.object({
  lessonId: z.string().cuid().optional(),
  content: z.string().trim().min(1, "Write something before saving."),
});

export const discussionPostSchema = z.object({
  tribeId: z.string().cuid(),
  body: z.string().trim().min(1).max(2000),
});

export const prayerRequestSchema = z.object({
  tribeId: z.string().cuid(),
  body: z.string().trim().min(1).max(1000),
});

export const givingSchema = z.object({
  amountCents: z.number().int().min(100, "Minimum gift is $1."),
  type: z.enum(["ONE_TIME", "RECURRING"]),
  designation: z.string().trim().optional(),
});
