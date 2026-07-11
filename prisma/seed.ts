import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PERMISSION_CATALOG, DEFAULT_ROLE_PERMISSIONS } from "../lib/permissions";
import type { Role } from "../lib/generated/prisma/enums";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const REFLECTION_QUESTIONS = [
  "What is God revealing?",
  "What mindset is changing?",
  "What truth am I embracing?",
];

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

async function main() {
  console.log("Seeding Kingdom Tribe City...");

  // ── Programs ─────────────────────────────────────────────────────────
  const plantedAndRooted = await prisma.program.upsert({
    where: { slug: "PLANTED_AND_ROOTED" },
    update: {},
    create: {
      slug: "PLANTED_AND_ROOTED",
      name: "Planted & Rooted",
      tagline: "The foundation discipleship school of Kingdom Tribe City.",
      description:
        "Planted & Rooted takes believers from spiritual infancy into maturity and Kingdom assignment — walking the full pathway from Planted to Sent.",
    },
  });

  const youngAndYielded = await prisma.program.upsert({
    where: { slug: "YOUNG_AND_YIELDED" },
    update: {},
    create: {
      slug: "YOUNG_AND_YIELDED",
      name: "Young & Yielded",
      tagline: "Youth revival gatherings raising a yielded generation.",
      description:
        "Young & Yielded exists to see young people encounter God, surrender fully, and carry revival into their generation.",
    },
  });

  const kingdomWarriorWoman = await prisma.program.upsert({
    where: { slug: "KINGDOM_WARRIOR_WOMAN" },
    update: {},
    create: {
      slug: "KINGDOM_WARRIOR_WOMAN",
      name: "Kingdom Warrior Woman",
      tagline: "Women rising in identity, prayer, and Kingdom authority.",
      description:
        "Kingdom Warrior Woman gathers women to pray, grow, and walk in the fullness of who God has called them to be.",
    },
  });

  const kingdomLeaders = await prisma.program.upsert({
    where: { slug: "KINGDOM_LEADERS" },
    update: {},
    create: {
      slug: "KINGDOM_LEADERS",
      name: "Kingdom Leaders",
      tagline: "Equipping those called to lead and multiply leaders.",
      description:
        "Kingdom Leaders develops character, competence, and calling in those God is raising to lead in the Church and every sphere of society.",
    },
  });

  // ── Permissions ──────────────────────────────────────────────────────
  const permissionIdByKey = new Map<string, string>();
  for (const p of PERMISSION_CATALOG) {
    const created = await prisma.permission.upsert({
      where: { key: p.key },
      update: { label: p.label, category: p.category },
      create: { key: p.key, label: p.label, category: p.category },
    });
    permissionIdByKey.set(p.key, created.id);
  }

  for (const [role, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    if (role === "SUPER_ADMIN") continue; // bypasses permission checks entirely, nothing to seed
    for (const key of keys) {
      const permissionId = permissionIdByKey.get(key);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role: role as Role, permissionId } },
        update: {},
        create: { role: role as Role, permissionId },
      });
    }
  }

  // ── Courses / Modules / Lessons ─────────────────────────────────────
  type LessonSeed = {
    slug: string;
    title: string;
    summary: string;
    teachingBody: string;
    scriptureRefs: string[];
    scriptureText: string;
    assignmentPrompt: string;
    journalPrompt: string;
  };

  type ModuleSeed = { title: string; description: string; lessons: LessonSeed[] };

  type CourseSeed = {
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    stage: "PLANTED" | "ROOTED" | "FORMED";
    modules: ModuleSeed[];
  };

  const courseSeeds: CourseSeed[] = [
    {
      slug: "planted-identity-foundations",
      title: "Planted: Identity Foundations",
      subtitle: "Who am I in Christ?",
      description:
        "Before you can build a life, a family, or an assignment, you need to know who you are. Planted lays the identity foundation everything else is built on.",
      stage: "PLANTED",
      modules: [
        {
          title: "Who God Says I Am",
          description: "Replacing self-definition with God's declaration over your life.",
          lessons: [
            {
              slug: "a-new-creation",
              title: "A New Creation",
              summary: "Your old identity died at the cross. A new one was raised.",
              teachingBody:
                "Identity is not something you build — it's something you receive. When you came to Christ, you didn't just get a fresh start; you became a fundamentally new person. The old labels, old shame, old patterns — they no longer define you. Today's teaching walks through what it means, practically, to live from a new-creation identity rather than trying to earn one.",
              scriptureRefs: ["2 Corinthians 5:17", "Galatians 2:20"],
              scriptureText:
                "\"Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.\" — 2 Corinthians 5:17",
              assignmentPrompt:
                "Write down three labels you've believed about yourself that don't match what God says about you. Beside each, write the truth from Scripture.",
              journalPrompt: "What old identity is God asking you to lay down this week?",
            },
            {
              slug: "adopted-as-a-child-of-god",
              title: "Adopted as a Child of God",
              summary: "You were not just forgiven — you were adopted into the family.",
              teachingBody:
                "Adoption changes everything about how you relate to God. You're not a servant hoping to earn approval — you're a son or daughter who already has it. This lesson unpacks the legal and relational weight of adoption in the Kingdom, and why so many believers still live like orphans in a Father's house.",
              scriptureRefs: ["Romans 8:15-16", "Ephesians 1:5"],
              scriptureText:
                "\"For you did not receive the spirit of slavery to fall back into fear, but you have received the Spirit of adoption as sons.\" — Romans 8:15",
              assignmentPrompt:
                "Identify one area where you relate to God as a servant instead of a child. Bring it to Him in prayer this week.",
              journalPrompt: "Where do I still perform for approval instead of resting in belonging?",
            },
          ],
        },
        {
          title: "Leaving the Orphan Mindset",
          description: "Moving from striving and self-protection into sonship.",
          lessons: [
            {
              slug: "from-orphan-to-son",
              title: "From Orphan to Son or Daughter",
              summary: "The orphan mindset strives. The son or daughter rests and receives.",
              teachingBody:
                "An orphan mindset shows up as striving, comparison, self-protection, and difficulty receiving love without earning it. Sonship looks completely different — security, rest, and freedom to fail without losing identity. This lesson names the orphan patterns so they can be recognized and replaced.",
              scriptureRefs: ["John 14:18", "Romans 8:14-17"],
              scriptureText: "\"I will not leave you as orphans; I will come to you.\" — John 14:18",
              assignmentPrompt:
                "Notice one moment this week where you strive instead of rest. Pause and pray, \"Father, I don't have to earn this.\"",
              journalPrompt: "What does striving look like in my life right now?",
            },
            {
              slug: "receiving-the-fathers-love",
              title: "Receiving the Father's Love",
              summary: "Love received becomes love that can be given away.",
              teachingBody:
                "It's possible to know about God's love intellectually while never actually receiving it. This lesson is a guided invitation to slow down and let the Father's love move from a fact you agree with to an experience that reshapes you.",
              scriptureRefs: ["1 John 4:18-19", "Zephaniah 3:17"],
              scriptureText:
                "\"We love because he first loved us.\" — 1 John 4:19",
              assignmentPrompt:
                "Spend ten unhurried minutes simply receiving — no requests, no agenda. Let God love you.",
              journalPrompt: "What did it feel like to just receive, without striving?",
            },
          ],
        },
      ],
    },
    {
      slug: "rooted-life-with-god",
      title: "Rooted: Life With God",
      subtitle: "How do I know Him?",
      description:
        "Rooted builds the daily rhythms of intimacy — prayer, the Word, and obedience — that keep a life from being shaken when storms come.",
      stage: "ROOTED",
      modules: [
        {
          title: "The Secret Place",
          description: "Building a sustainable, honest life of prayer.",
          lessons: [
            {
              slug: "building-a-prayer-life",
              title: "Building a Prayer Life",
              summary: "Prayer is relationship, not performance.",
              teachingBody:
                "Most people quit praying because they inherited a performance model of prayer. This lesson resets prayer as ongoing conversation with a Father who already delights in you, and gives a simple, sustainable rhythm to build from.",
              scriptureRefs: ["Matthew 6:6", "1 Thessalonians 5:17"],
              scriptureText: "\"Pray without ceasing.\" — 1 Thessalonians 5:17",
              assignmentPrompt: "Set a specific time and place for prayer this week and keep the appointment three times.",
              journalPrompt: "What is honest right now — what do I actually want to say to God?",
            },
            {
              slug: "hearing-gods-voice",
              title: "Hearing God's Voice",
              summary: "Learning to recognize the Shepherd's voice among the noise.",
              teachingBody:
                "God is not silent — He is speaking constantly, through His Word, His Spirit, and His people. This lesson teaches practical ways to quiet the noise and grow confidence in recognizing His voice.",
              scriptureRefs: ["John 10:27", "1 Kings 19:11-13"],
              scriptureText: "\"My sheep hear my voice, and I know them, and they follow me.\" — John 10:27",
              assignmentPrompt: "Practice five minutes of silence, asking one question and simply listening.",
              journalPrompt: "What did I sense God saying, even faintly?",
            },
          ],
        },
        {
          title: "The Word as Bread",
          description: "Feeding on Scripture until it becomes life, not information.",
          lessons: [
            {
              slug: "meditating-on-scripture",
              title: "Meditating on Scripture",
              summary: "Slow reading that lets the Word take root.",
              teachingBody:
                "Meditation isn't emptying your mind — it's filling it, slowly, with truth until it reshapes how you think. This lesson teaches a simple meditation practice you can use with any passage.",
              scriptureRefs: ["Psalm 1:2-3", "Joshua 1:8"],
              scriptureText:
                "\"His delight is in the law of the Lord, and on his law he meditates day and night.\" — Psalm 1:2",
              assignmentPrompt: "Choose one verse and meditate on it slowly for five minutes daily this week.",
              journalPrompt: "What word or phrase kept returning to me?",
            },
            {
              slug: "obedience-as-love",
              title: "Obedience as Love",
              summary: "Obedience is not legalism — it's the language of love.",
              teachingBody:
                "Obedience gets a bad reputation because it's often taught as duty. Scripture frames it differently: obedience is how love for God is expressed and how trust is proven. This lesson reframes obedience as an act of intimacy, not restriction.",
              scriptureRefs: ["John 14:15", "1 Samuel 15:22"],
              scriptureText: "\"If you love me, you will keep my commandments.\" — John 14:15",
              assignmentPrompt: "Identify one thing God has already asked you to do that you've delayed. Do it this week.",
              journalPrompt: "Where is delayed obedience quietly costing me intimacy?",
            },
          ],
        },
      ],
    },
    {
      slug: "formed-the-renewed-mind",
      title: "Formed: The Renewed Mind",
      subtitle: "Who am I becoming?",
      description:
        "Formed moves from information to transformation — renewing the mind, building character, and establishing the disciplines that sustain a fruitful life.",
      stage: "FORMED",
      modules: [
        {
          title: "Renewing the Mind",
          description: "Taking every thought captive and rebuilding belief patterns.",
          lessons: [
            {
              slug: "taking-every-thought-captive",
              title: "Taking Every Thought Captive",
              summary: "Transformation begins with what you allow yourself to think.",
              teachingBody:
                "You cannot consistently behave in a way that contradicts what you believe. This lesson teaches how to identify lie-based thought patterns and actively replace them with truth — not through willpower, but through renewed belief.",
              scriptureRefs: ["Romans 12:2", "2 Corinthians 10:5"],
              scriptureText:
                "\"Do not be conformed to this world, but be transformed by the renewal of your mind.\" — Romans 12:2",
              assignmentPrompt: "Catch one recurring negative thought this week and write the Scripture that directly answers it.",
              journalPrompt: "What thought pattern keeps repeating, and where did it come from?",
            },
            {
              slug: "character-over-gifting",
              title: "Character Over Gifting",
              summary: "Gifting opens doors; character keeps you in the room.",
              teachingBody:
                "It's possible to be highly gifted and deeply unformed. This lesson makes the case that Kingdom formation prioritizes character — integrity, humility, self-control — as the foundation gifting is meant to stand on, not a substitute for it.",
              scriptureRefs: ["1 Samuel 16:7", "Galatians 5:22-23"],
              scriptureText:
                "\"Man looks on the outward appearance, but the Lord looks on the heart.\" — 1 Samuel 16:7",
              assignmentPrompt: "Ask someone who knows you well: 'Where do you see a gap between my gift and my character?' Receive it without defending.",
              journalPrompt: "Where has God been quietly working on my character lately?",
            },
          ],
        },
        {
          title: "Walking in Discipline",
          description: "Building the daily faithfulness that fruitfulness is built on.",
          lessons: [
            {
              slug: "the-fruit-of-the-spirit",
              title: "The Fruit of the Spirit",
              summary: "Fruit grows slowly, and it grows from abiding, not striving.",
              teachingBody:
                "The fruit of the Spirit isn't a personality upgrade you achieve — it's the natural outflow of a life abiding in Christ. This lesson looks honestly at which fruit is thin in your life right now, and what abiding practically looks like.",
              scriptureRefs: ["John 15:4-5", "Galatians 5:22-23"],
              scriptureText: "\"Abide in me, and I in you... apart from me you can do nothing.\" — John 15:4-5",
              assignmentPrompt: "Choose the fruit that feels thinnest right now and ask God to grow it — then watch for one small opportunity to practice it this week.",
              journalPrompt: "Which fruit of the Spirit is God growing in me right now, and how?",
            },
            {
              slug: "faithfulness-in-the-small",
              title: "Faithfulness in the Small",
              summary: "Assignment is entrusted to those faithful in the unseen.",
              teachingBody:
                "Before God releases a person into a large assignment, He tests faithfulness in the small, unseen places. This lesson challenges the desire to skip ahead to 'Sent' and instead build a track record of faithfulness where no one is watching.",
              scriptureRefs: ["Luke 16:10", "Matthew 25:21"],
              scriptureText: "\"One who is faithful in a very little is also faithful in much.\" — Luke 16:10",
              assignmentPrompt: "Identify one small, unseen responsibility you've been neglecting and be faithful in it this week.",
              journalPrompt: "Where is God testing my faithfulness in something small right now?",
            },
          ],
        },
      ],
    },
  ];

  const courseIdBySlug = new Map<string, string>();
  const courseCoverImage: Record<string, string> = {
    "planted-identity-foundations":
      "https://images.unsplash.com/photo-1712342109846-a8fcb1c883ba?w=1600&q=80&auto=format&fit=crop",
  };

  for (const [i, c] of courseSeeds.entries()) {
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        programId: plantedAndRooted.id,
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        stage: c.stage,
        order: i,
        coverImage: courseCoverImage[c.slug] ?? null,
      },
    });
    courseIdBySlug.set(c.slug, course.id);

    for (const [mi, m] of c.modules.entries()) {
      const mod = await prisma.module.upsert({
        where: { id: `${course.id}-seed-mod-${mi}` },
        update: {},
        create: {
          id: `${course.id}-seed-mod-${mi}`,
          courseId: course.id,
          title: m.title,
          description: m.description,
          order: mi,
        },
      });

      for (const [li, l] of m.lessons.entries()) {
        await prisma.lesson.upsert({
          where: { moduleId_slug: { moduleId: mod.id, slug: l.slug } },
          update: {},
          create: {
            moduleId: mod.id,
            slug: l.slug,
            title: l.title,
            summary: l.summary,
            order: li,
            teachingBody: l.teachingBody,
            scriptureRefs: l.scriptureRefs,
            scriptureText: l.scriptureText,
            reflectionQuestions: REFLECTION_QUESTIONS,
            assignmentPrompt: l.assignmentPrompt,
            journalPrompt: l.journalPrompt,
          },
        });
      }
    }
  }

  // ── Users ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("KingdomDemo!23", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@kingdomtribecity.org" },
    update: {},
    create: {
      email: "admin@kingdomtribecity.org",
      name: "Pastor Josiah Ade",
      passwordHash,
      role: "ADMIN",
      stage: "SENT",
      sphereOfInfluence: "Ministry",
      onboardedAt: new Date(),
    },
  });

  const mentorDeborah = await prisma.user.upsert({
    where: { email: "mentor.deborah@kingdomtribecity.org" },
    update: {},
    create: {
      email: "mentor.deborah@kingdomtribecity.org",
      name: "Grace Adeyemi",
      passwordHash,
      role: "MENTOR",
      stage: "SENT",
      sphereOfInfluence: "Business",
      onboardedAt: new Date(),
    },
  });

  const mentorDaniel = await prisma.user.upsert({
    where: { email: "mentor.daniel@kingdomtribecity.org" },
    update: {},
    create: {
      email: "mentor.daniel@kingdomtribecity.org",
      name: "Michael Obi",
      passwordHash,
      role: "MENTOR",
      stage: "FRUITFUL",
      sphereOfInfluence: "Technology",
      onboardedAt: new Date(),
    },
  });

  const mentorEsther = await prisma.user.upsert({
    where: { email: "mentor.esther@kingdomtribecity.org" },
    update: {},
    create: {
      email: "mentor.esther@kingdomtribecity.org",
      name: "Naomi Ruth",
      passwordHash,
      role: "MENTOR",
      stage: "FRUITFUL",
      sphereOfInfluence: "Education",
      onboardedAt: new Date(),
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@kingdomtribecity.org" },
    update: {},
    create: {
      email: "superadmin@kingdomtribecity.org",
      name: "Kingdom Tribe City Ops",
      passwordHash,
      role: "SUPER_ADMIN",
      stage: "SENT",
      sphereOfInfluence: "Ministry",
      onboardedAt: new Date(),
    },
  });

  const ministryLeader = await prisma.user.upsert({
    where: { email: "leader@kingdomtribecity.org" },
    update: {},
    create: {
      email: "leader@kingdomtribecity.org",
      name: "Pastor Deborah Iyabo",
      passwordHash,
      role: "MINISTRY_LEADER",
      stage: "SENT",
      sphereOfInfluence: "Ministry",
      onboardedAt: new Date(),
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: "instructor@kingdomtribecity.org" },
    update: {},
    create: {
      email: "instructor@kingdomtribecity.org",
      name: "Dr. Samuel Okoye",
      passwordHash,
      role: "INSTRUCTOR",
      stage: "FRUITFUL",
      sphereOfInfluence: "Education",
      onboardedAt: new Date(),
    },
  });
  void superAdmin;
  void ministryLeader;

  // Give the demo instructor a course of their own, to demonstrate admin scoping.
  await prisma.course.updateMany({
    where: { slug: "formed-the-renewed-mind" },
    data: { authorId: instructor.id },
  });

  const demoStudent = await prisma.user.upsert({
    where: { email: "student@kingdomtribecity.org" },
    update: {},
    create: {
      email: "student@kingdomtribecity.org",
      name: "Ade Johnson",
      passwordHash,
      role: "STUDENT",
      stage: "PLANTED",
      sphereOfInfluence: "Healthcare",
      onboardedAt: new Date(),
    },
  });

  const extraStudentSeeds = [
    { email: "chidinma@kingdomtribecity.org", name: "Chidinma Okafor", sphere: "Media" },
    { email: "samuel@kingdomtribecity.org", name: "Samuel Bello", sphere: "Government" },
    { email: "faith@kingdomtribecity.org", name: "Faith Nwosu", sphere: "Family" },
    { email: "david@kingdomtribecity.org", name: "David Musa", sphere: "Technology" },
    { email: "esther.a@kingdomtribecity.org", name: "Esther Alabi", sphere: "Education" },
    { email: "joseph@kingdomtribecity.org", name: "Joseph King", sphere: "Business" },
  ];

  const extraStudents = [];
  for (const s of extraStudentSeeds) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        name: s.name,
        passwordHash,
        role: "STUDENT",
        stage: "PLANTED",
        sphereOfInfluence: s.sphere,
        onboardedAt: new Date(),
      },
    });
    extraStudents.push(u);
  }

  // ── Cohort & Tribes ──────────────────────────────────────────────────
  const cohort = await prisma.cohort.upsert({
    where: { slug: "planted-and-rooted-cohort-one" },
    update: {},
    create: {
      slug: "planted-and-rooted-cohort-one",
      name: "Planted and Rooted Cohort One",
      startDate: daysAgo(30),
      active: true,
    },
  });

  const tribeDeborah = await prisma.tribe.upsert({
    where: { slug: "tribe-deborah" },
    update: { mentorId: mentorDeborah.id },
    create: {
      cohortId: cohort.id,
      slug: "tribe-deborah",
      name: "Tribe Deborah",
      mentorId: mentorDeborah.id,
    },
  });

  const tribeDaniel = await prisma.tribe.upsert({
    where: { slug: "tribe-daniel" },
    update: { mentorId: mentorDaniel.id },
    create: {
      cohortId: cohort.id,
      slug: "tribe-daniel",
      name: "Tribe Daniel",
      mentorId: mentorDaniel.id,
    },
  });

  const tribeEsther = await prisma.tribe.upsert({
    where: { slug: "tribe-esther" },
    update: { mentorId: mentorEsther.id },
    create: {
      cohortId: cohort.id,
      slug: "tribe-esther",
      name: "Tribe Esther",
      mentorId: mentorEsther.id,
    },
  });

  const tribeAssignments: [string, string][] = [
    [demoStudent.id, tribeDeborah.id],
    [extraStudents[0].id, tribeDeborah.id],
    [extraStudents[1].id, tribeDeborah.id],
    [extraStudents[2].id, tribeDaniel.id],
    [extraStudents[3].id, tribeDaniel.id],
    [extraStudents[4].id, tribeEsther.id],
    [extraStudents[5].id, tribeEsther.id],
  ];

  for (const [userId, tribeId] of tribeAssignments) {
    await prisma.tribeMembership.upsert({
      where: { userId_tribeId: { userId, tribeId } },
      update: {},
      create: { userId, tribeId },
    });
  }

  // ── Demo student progress (so dashboard/streak demo well) ───────────
  const course1Id = courseIdBySlug.get("planted-identity-foundations")!;

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: demoStudent.id, courseId: course1Id } },
    update: {},
    create: { userId: demoStudent.id, courseId: course1Id, enrolledAt: daysAgo(6) },
  });

  const firstLesson = await prisma.lesson.findFirst({
    where: { module: { course: { id: course1Id } }, slug: "a-new-creation" },
  });

  if (firstLesson) {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: demoStudent.id, lessonId: firstLesson.id } },
      update: {},
      create: {
        userId: demoStudent.id,
        lessonId: firstLesson.id,
        status: "COMPLETED",
        teachingViewedAt: daysAgo(2),
        reflectionDoneAt: daysAgo(2),
        assignmentDoneAt: daysAgo(1),
        journalDoneAt: daysAgo(1),
        completedAt: daysAgo(1),
      },
    });

    await prisma.reflectionEntry.upsert({
      where: { userId_lessonId: { userId: demoStudent.id, lessonId: firstLesson.id } },
      update: {},
      create: {
        userId: demoStudent.id,
        lessonId: firstLesson.id,
        answers: {
          [REFLECTION_QUESTIONS[0]]:
            "That my identity was never meant to be something I built myself.",
          [REFLECTION_QUESTIONS[1]]:
            "I'm starting to see myself as chosen, not just tolerated.",
          [REFLECTION_QUESTIONS[2]]:
            "I am a new creation — the old truly has passed away.",
        },
      },
    });

    await prisma.journalEntry.upsert({
      where: { id: `${demoStudent.id}-${firstLesson.id}-seed-journal` },
      update: {},
      create: {
        id: `${demoStudent.id}-${firstLesson.id}-seed-journal`,
        userId: demoStudent.id,
        lessonId: firstLesson.id,
        content:
          "Today I let go of a label I've carried for years — 'not enough.' Sitting with 2 Corinthians 5:17 today, I actually believed, even for a moment, that the old really has passed away.",
        createdAt: daysAgo(1),
      },
    });
  }

  await prisma.journalEntry.upsert({
    where: { id: `${demoStudent.id}-freeform-seed-journal` },
    update: {},
    create: {
      id: `${demoStudent.id}-freeform-seed-journal`,
      userId: demoStudent.id,
      content: "Grateful today. Tribe Deborah prayed for my family last night and I felt so carried.",
      createdAt: daysAgo(0),
    },
  });

  // ── Discussions & Prayer ─────────────────────────────────────────────
  const post = await prisma.discussionPost.upsert({
    where: { id: `${tribeDeborah.id}-seed-post-1` },
    update: {},
    create: {
      id: `${tribeDeborah.id}-seed-post-1`,
      tribeId: tribeDeborah.id,
      userId: mentorDeborah.id,
      body: "Welcome to Tribe Deborah! This week let's each share one thing God highlighted in the 'A New Creation' lesson. I'll go first: I was struck by how much of my striving was rooted in an old identity I never actually renounced.",
      createdAt: daysAgo(4),
    },
  });

  await prisma.discussionComment.upsert({
    where: { id: `${post.id}-seed-comment-1` },
    update: {},
    create: {
      id: `${post.id}-seed-comment-1`,
      postId: post.id,
      userId: demoStudent.id,
      body: "This landed for me too. I never realized how much I was still performing for approval I already have.",
      createdAt: daysAgo(3),
    },
  });

  await prisma.prayerRequest.upsert({
    where: { id: `${tribeDeborah.id}-seed-prayer-1` },
    update: {},
    create: {
      id: `${tribeDeborah.id}-seed-prayer-1`,
      tribeId: tribeDeborah.id,
      userId: extraStudents[0].id,
      body: "Praying for wisdom in a big decision at work this week — asking for clarity and peace.",
      status: "OPEN",
      createdAt: daysAgo(2),
    },
  });

  await prisma.prayerRequest.upsert({
    where: { id: `${tribeDeborah.id}-seed-prayer-2` },
    update: {},
    create: {
      id: `${tribeDeborah.id}-seed-prayer-2`,
      tribeId: tribeDeborah.id,
      userId: extraStudents[1].id,
      body: "Thank you all for praying for my mother's health last month — she's doing so much better now!",
      status: "ANSWERED",
      createdAt: daysAgo(10),
    },
  });

  // ── Testimonies ──────────────────────────────────────────────────────
  await prisma.testimony.upsert({
    where: { id: "seed-testimony-1" },
    update: {},
    create: {
      id: "seed-testimony-1",
      userId: demoStudent.id,
      title: "I finally understand who I am",
      body: "Planted didn't just teach me facts about identity — it walked with me until I actually believed them. For the first time, I'm not striving to become someone God already says I am.",
      featured: true,
      approved: true,
      createdAt: daysAgo(5),
    },
  });

  await prisma.testimony.upsert({
    where: { id: "seed-testimony-2" },
    update: {},
    create: {
      id: "seed-testimony-2",
      userId: extraStudents[2].id,
      title: "My Tribe became my family",
      body: "I moved to a new city with no community. Tribe Esther prayed with me through the hardest season of my life and never let me walk it alone.",
      featured: true,
      approved: true,
      createdAt: daysAgo(15),
    },
  });

  // ── Events ───────────────────────────────────────────────────────────
  const speaker = await prisma.speaker.upsert({
    where: { id: "seed-speaker-1" },
    update: {},
    create: {
      id: "seed-speaker-1",
      name: "Pastor Josiah Ade",
      title: "Founding Pastor, Kingdom Tribe City",
      bio: "Josiah leads Kingdom Tribe City with a passion for raising Kingdom Ambassadors who carry Christ into every sphere of society.",
    },
  });

  await prisma.event.upsert({
    where: { slug: "planted-rooted-live-intensive" },
    update: {},
    create: {
      slug: "planted-rooted-live-intensive",
      programId: plantedAndRooted.id,
      title: "Planted & Rooted Live Intensive",
      description:
        "A live weekend gathering for every Planted & Rooted cohort member — worship, teaching, and Tribe time in person.",
      location: "Kingdom Tribe City Campus",
      startsAt: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 21);
        return d;
      })(),
      speakers: { connect: [{ id: speaker.id }] },
    },
  });

  await prisma.event.upsert({
    where: { slug: "young-and-yielded-revival-night" },
    update: {},
    create: {
      slug: "young-and-yielded-revival-night",
      programId: youngAndYielded.id,
      title: "Young & Yielded: Revival Night",
      description:
        "An evening of worship and encounter for the next generation — come hungry, come yielded.",
      location: "Kingdom Tribe City Campus",
      startsAt: daysAgo(-45),
      endsAt: daysAgo(-45),
      recordingUrl: null,
      speakers: { connect: [{ id: speaker.id }] },
    },
  });

  // ── Resources ────────────────────────────────────────────────────────
  const resourceSeeds = [
    {
      slug: "walking-in-sonship",
      title: "Walking in Sonship",
      description: "A short teaching on trading the orphan mindset for sonship.",
      type: "ARTICLE" as const,
      category: "IDENTITY" as const,
      tags: ["identity", "sonship", "planted"],
      visibility: "PUBLIC" as const,
      programId: plantedAndRooted.id,
      speakerId: speaker.id,
      coverImage:
        "https://images.unsplash.com/photo-1712342109846-a8fcb1c883ba?w=1200&q=80&auto=format&fit=crop",
    },
    {
      slug: "a-simple-prayer-rhythm",
      title: "A Simple Prayer Rhythm",
      description: "A practical daily structure for building consistency in prayer.",
      type: "DEVOTIONAL" as const,
      category: "PRAYER" as const,
      tags: ["prayer", "rhythm", "rooted"],
      visibility: "PUBLIC" as const,
      programId: plantedAndRooted.id,
      speakerId: speaker.id,
      coverImage:
        "https://plus.unsplash.com/premium_photo-1770544880707-f293de8c28fa?w=1200&q=80&auto=format&fit=crop",
    },
    {
      slug: "leading-from-character",
      title: "Leading From Character",
      description: "Why Kingdom leadership starts with formation, not skill.",
      type: "ARTICLE" as const,
      category: "LEADERSHIP" as const,
      tags: ["leadership", "character"],
      visibility: "LEADERS" as const,
      programId: kingdomLeaders.id,
      speakerId: speaker.id,
      coverImage:
        "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=1200&q=80&auto=format&fit=crop",
    },
    {
      slug: "discovering-your-assignment",
      title: "Discovering Your Assignment",
      description: "A guided study on uncovering purpose and calling.",
      type: "STUDY" as const,
      category: "PURPOSE" as const,
      tags: ["purpose", "calling", "fruitful"],
      visibility: "STUDENTS" as const,
      programId: plantedAndRooted.id,
      speakerId: speaker.id,
      coverImage: null,
    },
    {
      slug: "marriage-and-the-kingdom",
      title: "Marriage and the Kingdom",
      description: "A sermon on building Kingdom-centered marriages and homes.",
      type: "SERMON" as const,
      category: "RELATIONSHIPS" as const,
      tags: ["marriage", "family"],
      visibility: "PUBLIC" as const,
      programId: null,
      speakerId: speaker.id,
      coverImage: null,
    },
    {
      slug: "the-renewed-mind-devotional",
      title: "The Renewed Mind: A 7-Day Devotional",
      description: "Seven days of Scripture and reflection on Romans 12:2.",
      type: "DEVOTIONAL" as const,
      category: "SPIRITUAL_GROWTH" as const,
      tags: ["renewal", "mind", "formed"],
      visibility: "PUBLIC" as const,
      programId: plantedAndRooted.id,
      speakerId: speaker.id,
      coverImage: null,
    },
    {
      slug: "revival-night-highlights",
      title: "Revival Night Highlights",
      description: "Watch the highlight reel from the last Young & Yielded revival night.",
      type: "YOUTUBE" as const,
      category: "SPIRITUAL_GROWTH" as const,
      tags: ["youth", "revival", "worship"],
      visibility: "PUBLIC" as const,
      programId: youngAndYielded.id,
      speakerId: null,
      externalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      coverImage:
        "https://images.unsplash.com/photo-1691491071054-6371dfc47d6e?w=1200&q=80&auto=format&fit=crop",
    },
    {
      slug: "kingdom-warrior-woman-workbook",
      title: "Kingdom Warrior Woman Workbook",
      description: "A companion workbook for the Kingdom Warrior Woman gatherings.",
      type: "WORKBOOK" as const,
      category: "IDENTITY" as const,
      tags: ["women", "identity", "workbook"],
      visibility: "MEMBERS" as const,
      programId: kingdomWarriorWoman.id,
      speakerId: null,
      coverImage:
        "https://plus.unsplash.com/premium_photo-1706026427244-3b3df84382d8?w=1200&q=80&auto=format&fit=crop",
    },
  ];

  for (const r of resourceSeeds) {
    await prisma.resource.upsert({
      where: { slug: r.slug },
      update: {},
      create: r,
    });
  }

  // ── Announcements ────────────────────────────────────────────────────
  await prisma.announcement.upsert({
    where: { id: "seed-announcement-1" },
    update: {},
    create: {
      id: "seed-announcement-1",
      title: "Cohort One registration is open",
      body: "Planted and Rooted Cohort One is now open for new members. Invite someone who's ready to be planted.",
      pinned: true,
    },
  });

  console.log("Seed complete.");
  console.log("Demo logins (password: KingdomDemo!23):");
  console.log("  superadmin@kingdomtribecity.org (SUPER_ADMIN)");
  console.log("  admin@kingdomtribecity.org      (ADMIN)");
  console.log("  leader@kingdomtribecity.org     (MINISTRY_LEADER)");
  console.log("  instructor@kingdomtribecity.org (INSTRUCTOR)");
  console.log("  mentor.deborah@kingdomtribecity.org (MENTOR)");
  console.log("  student@kingdomtribecity.org    (STUDENT)");
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
