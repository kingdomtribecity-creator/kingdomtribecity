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
  // Kingdom Tribe City is the ecosystem; every program below (including the
  // flagship) is an ordinary row an admin could create from /admin/programs
  // — nothing about a specific curriculum is hardcoded in application code.
  const rootedAndBuiltData = {
    name: "Rooted and Built",
    tagline: "The foundation discipleship school of Kingdom Tribe City.",
    description:
      "Rooted and Built takes believers from spiritual infancy into maturity and Kingdom assignment — walking the full Planted → Rooted → Formed → Fruitful pathway inside a single, cohort-based course.",
    visionBody:
      "We believe every believer is meant to be planted deep, rooted in intimacy with God, formed in character, and sent out fruitful into every sphere of society. Rooted and Built exists to walk you through that whole journey — not alone, but inside a Tribe that knows your name.",
  };
  const rootedAndBuilt = await prisma.program.upsert({
    where: { slug: "rooted-and-built" },
    update: rootedAndBuiltData,
    create: { slug: "rooted-and-built", ...rootedAndBuiltData },
  });

  const youngAndYielded = await prisma.program.upsert({
    where: { slug: "young-and-yielded" },
    update: {},
    create: {
      slug: "young-and-yielded",
      name: "Young & Yielded",
      tagline: "Youth revival gatherings raising a yielded generation.",
      description:
        "Young & Yielded exists to see young people encounter God, surrender fully, and carry revival into their generation.",
    },
  });

  const kingdomWarriorWoman = await prisma.program.upsert({
    where: { slug: "kingdom-warrior-woman" },
    update: {},
    create: {
      slug: "kingdom-warrior-woman",
      name: "Kingdom Warrior Woman",
      tagline: "Women rising in identity, prayer, and Kingdom authority.",
      description:
        "Kingdom Warrior Woman gathers women to pray, grow, and walk in the fullness of who God has called them to be.",
    },
  });

  const kingdomLeaders = await prisma.program.upsert({
    where: { slug: "kingdom-leaders" },
    update: {},
    create: {
      slug: "kingdom-leaders",
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

  // ── Users (created early so courses can reference an author) ─────────
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

  // ── Flagship course: Rooted and Built ─────────────────────────────────
  // ONE course, FOUR stage-tagged modules — the transformation pathway is a
  // platform-level concept (Module.stage), not something baked into a
  // specific course. Any future program can tag its own modules the same
  // way and contribute to a student's growth tracks.
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

  type ModuleSeed = {
    title: string;
    description: string;
    stage: "PLANTED" | "ROOTED" | "FORMED" | "FRUITFUL";
    lessons: LessonSeed[];
  };

  const moduleSeeds: ModuleSeed[] = [
    {
      title: "Identity",
      description: "Who am I in Christ? Replacing self-definition with God's declaration.",
      stage: "PLANTED",
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
          scriptureText: "\"We love because he first loved us.\" — 1 John 4:19",
          assignmentPrompt:
            "Spend ten unhurried minutes simply receiving — no requests, no agenda. Let God love you.",
          journalPrompt: "What did it feel like to just receive, without striving?",
        },
      ],
    },
    {
      title: "Relationship with God",
      description: "How do I know Him? Building the daily rhythms of intimacy.",
      stage: "ROOTED",
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
    {
      title: "Formation",
      description: "Who am I becoming? Renewing the mind and building character.",
      stage: "FORMED",
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
    {
      title: "Kingdom Assignment",
      description: "What am I made to do? Purpose, gifts, and stepping into calling.",
      stage: "FRUITFUL",
      lessons: [
        {
          slug: "discovering-your-gifts",
          title: "Discovering Your Gifts",
          summary: "God didn't just save you — He equipped you with something specific to give.",
          teachingBody:
            "Every believer carries gifts placed there on purpose — not for self-promotion, but for building up others and advancing the Kingdom. This lesson helps you name what God has already put in your hands, often hiding in plain sight as the things you find most natural.",
          scriptureRefs: ["1 Peter 4:10", "Romans 12:6-8"],
          scriptureText:
            "\"As each has received a gift, use it to serve one another, as good stewards of God's varied grace.\" — 1 Peter 4:10",
          assignmentPrompt:
            "Ask two people who know you well what they see you doing that seems to bless others without much effort. Write down what they say.",
          journalPrompt: "What has God already put in my hands that I've been underestimating?",
        },
        {
          slug: "stepping-into-your-assignment",
          title: "Stepping Into Your Assignment",
          summary: "An assignment isn't a title you're given — it's a door you walk through.",
          teachingBody:
            "Purpose rarely arrives as a full blueprint. More often it's a next step, obeyed in faith, that opens the following one. This lesson moves from discovering your gifts to actually stepping out — even in a small, unfinished way — in the sphere God has placed you.",
          scriptureRefs: ["Ephesians 2:10", "Esther 4:14"],
          scriptureText:
            "\"For we are his workmanship, created in Christ Jesus for good works, which God prepared beforehand, that we should walk in them.\" — Ephesians 2:10",
          assignmentPrompt:
            "Identify one specific, doable step you could take this month toward the assignment God has been highlighting. Take it.",
          journalPrompt: "What is God inviting me to step into right now, even if it feels small or unfinished?",
        },
      ],
    },
  ];

  const rootedAndBuiltCourse = await prisma.course.upsert({
    where: { slug: "rooted-and-built" },
    update: {},
    create: {
      programId: rootedAndBuilt.id,
      slug: "rooted-and-built",
      title: "Rooted and Built",
      subtitle: "A twelve-week discipleship intensive",
      description:
        "The flagship Kingdom Tribe City discipleship journey — from identity to intimacy, formation, and Kingdom assignment — walked out together in a Tribe.",
      order: 0,
      status: "PUBLISHED",
      category: "Discipleship",
      difficulty: "BEGINNER",
      durationLabel: "12 weeks",
      format: "COHORT_BASED",
      accessLevel: "PUBLIC",
      pricingType: "FREE",
      certificateEnabled: true,
      coverImage:
        "https://images.unsplash.com/photo-1712342109846-a8fcb1c883ba?w=1600&q=80&auto=format&fit=crop",
    },
  });

  await prisma.program.update({
    where: { id: rootedAndBuilt.id },
    data: { featuredCourseId: rootedAndBuiltCourse.id },
  });

  for (const mentorUser of [mentorDeborah, mentorDaniel, mentorEsther]) {
    await prisma.courseMentor.upsert({
      where: { courseId_userId: { courseId: rootedAndBuiltCourse.id, userId: mentorUser.id } },
      update: {},
      create: { courseId: rootedAndBuiltCourse.id, userId: mentorUser.id },
    });
  }

  const rootedAndBuiltFaqs = [
    {
      question: "Do I need any prior Bible knowledge to start?",
      answer: "No — Rooted and Built is built for spiritual infancy through maturity. Come as you are.",
    },
    {
      question: "Is this self-paced or do I need to keep up with a group?",
      answer: "It's cohort-based — you walk through it alongside a Tribe, with a mentor, on a shared twelve-week rhythm.",
    },
    {
      question: "Is there a certificate when I finish?",
      answer: "Yes — completing every lesson in Rooted and Built issues a certificate you can view and share from your dashboard.",
    },
  ];
  for (const [i, faq] of rootedAndBuiltFaqs.entries()) {
    await prisma.programFaq.upsert({
      where: { id: `${rootedAndBuilt.id}-seed-faq-${i}` },
      update: {},
      create: { id: `${rootedAndBuilt.id}-seed-faq-${i}`, programId: rootedAndBuilt.id, ...faq, order: i },
    });
  }

  const lessonIdBySlug = new Map<string, string>();

  for (const [mi, m] of moduleSeeds.entries()) {
    const mod = await prisma.module.upsert({
      where: { id: `${rootedAndBuiltCourse.id}-seed-mod-${mi}` },
      update: { stage: m.stage },
      create: {
        id: `${rootedAndBuiltCourse.id}-seed-mod-${mi}`,
        courseId: rootedAndBuiltCourse.id,
        title: m.title,
        description: m.description,
        stage: m.stage,
        order: mi,
      },
    });

    for (const [li, l] of m.lessons.entries()) {
      const lesson = await prisma.lesson.upsert({
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
      lessonIdBySlug.set(l.slug, lesson.id);
    }
  }

  // A quiz on the very first lesson, to demonstrate the quiz engine end to end.
  const firstLessonId = lessonIdBySlug.get("a-new-creation")!;
  const existingQuiz = await prisma.quiz.findUnique({ where: { lessonId: firstLessonId } });
  if (!existingQuiz) {
    await prisma.quiz.create({
      data: {
        lessonId: firstLessonId,
        title: "Check Your Understanding",
        passScorePercent: 70,
        questions: {
          create: [
            {
              prompt: "According to 2 Corinthians 5:17, what happens to someone who is in Christ?",
              order: 0,
              options: {
                create: [
                  { label: "They become a new creation", isCorrect: true },
                  { label: "They stay the same but try harder", isCorrect: false },
                  { label: "They must earn a new identity", isCorrect: false },
                  { label: "Nothing changes until they die", isCorrect: false },
                ],
              },
            },
            {
              prompt: "What does an orphan mindset typically look like?",
              order: 1,
              options: {
                create: [
                  { label: "Rest and receiving", isCorrect: false },
                  { label: "Striving and self-protection", isCorrect: true },
                  { label: "Confidence in sonship", isCorrect: false },
                  { label: "Freedom to fail", isCorrect: false },
                ],
              },
            },
          ],
        },
      },
    });
  }

  // ── Instructor's own course (demonstrates admin scoping + paid courses) ─
  const leadersIntensive = await prisma.course.upsert({
    where: { slug: "kingdom-leaders-intensive" },
    update: { authorId: instructor.id },
    create: {
      programId: kingdomLeaders.id,
      authorId: instructor.id,
      slug: "kingdom-leaders-intensive",
      title: "Kingdom Leaders Intensive",
      subtitle: "Character and competence for those called to lead.",
      description:
        "A focused intensive for emerging leaders — character formation, decision-making under pressure, and multiplying leaders around you.",
      order: 0,
      status: "PUBLISHED",
      category: "Leadership",
      difficulty: "INTERMEDIATE",
      durationLabel: "6 weeks",
      format: "INTENSIVE",
      accessLevel: "PUBLIC",
      pricingType: "PAID",
      priceCents: 4900,
      certificateEnabled: true,
    },
  });

  const leadersModule = await prisma.module.upsert({
    where: { id: `${leadersIntensive.id}-seed-mod-0` },
    update: {},
    create: {
      id: `${leadersIntensive.id}-seed-mod-0`,
      courseId: leadersIntensive.id,
      title: "Foundations of Kingdom Leadership",
      description: "Leading from who you are, not just what you do.",
      order: 0,
    },
  });

  const leadersLessons = [
    {
      slug: "leading-from-who-you-are",
      title: "Leading From Who You Are, Not What You Do",
      summary: "Leadership flows out of formation — it isn't a substitute for it.",
      teachingBody:
        "Many leaders lead from performance because it's what got them noticed. But sustainable Kingdom leadership flows from an identity that doesn't need the platform to feel secure. This lesson examines what it looks like to lead from a settled sense of who you are in Christ.",
    },
    {
      slug: "decisions-under-pressure",
      title: "Decisions Under Pressure",
      summary: "How you decide when it's costly reveals what you actually believe.",
      teachingBody:
        "Pressure doesn't create character flaws — it reveals them. This lesson walks through a simple framework for making values-aligned decisions when the stakes are high and the answer isn't obvious.",
    },
  ];

  for (const [li, l] of leadersLessons.entries()) {
    await prisma.lesson.upsert({
      where: { moduleId_slug: { moduleId: leadersModule.id, slug: l.slug } },
      update: {},
      create: {
        moduleId: leadersModule.id,
        slug: l.slug,
        title: l.title,
        summary: l.summary,
        order: li,
        teachingBody: l.teachingBody,
        reflectionQuestions: REFLECTION_QUESTIONS,
        assignmentPrompt: "Apply this week's teaching to one real decision or conversation in front of you.",
        journalPrompt: "Where is God inviting me to lead from character rather than performance?",
      },
    });
  }

  // Cross-Expression discovery: Kingdom Leaders Intensive is owned by the
  // Kingdom Leaders program, but it's also relevant to Rooted and Built
  // graduates stepping into their Kingdom Assignment — feature it on that
  // Hub too, without duplicating the course row.
  await prisma.programCourseFeature.upsert({
    where: { programId_courseId: { programId: rootedAndBuilt.id, courseId: leadersIntensive.id } },
    update: {},
    create: { programId: rootedAndBuilt.id, courseId: leadersIntensive.id, order: 0 },
  });

  // ── Cohort & Tribes ──────────────────────────────────────────────────
  const cohort = await prisma.cohort.upsert({
    where: { slug: "rooted-and-built-cohort-one" },
    update: { courseId: rootedAndBuiltCourse.id },
    create: {
      courseId: rootedAndBuiltCourse.id,
      slug: "rooted-and-built-cohort-one",
      name: "Rooted and Built · Cohort One",
      startDate: daysAgo(30),
      status: "ACTIVE",
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
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: demoStudent.id, courseId: rootedAndBuiltCourse.id } },
    update: {},
    create: {
      userId: demoStudent.id,
      courseId: rootedAndBuiltCourse.id,
      cohortId: cohort.id,
      enrolledAt: daysAgo(6),
    },
  });

  const firstLesson = await prisma.lesson.findUnique({ where: { id: firstLessonId } });

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
    update: { programId: rootedAndBuilt.id },
    create: {
      id: "seed-testimony-1",
      userId: demoStudent.id,
      programId: rootedAndBuilt.id,
      title: "I finally understand who I am",
      body: "Rooted and Built didn't just teach me facts about identity — it walked with me until I actually believed them. For the first time, I'm not striving to become someone God already says I am.",
      featured: true,
      approved: true,
      createdAt: daysAgo(5),
    },
  });

  await prisma.testimony.upsert({
    where: { id: "seed-testimony-2" },
    update: { programId: rootedAndBuilt.id },
    create: {
      id: "seed-testimony-2",
      userId: extraStudents[2].id,
      programId: rootedAndBuilt.id,
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
    where: { slug: "rooted-and-built-live-intensive" },
    update: {},
    create: {
      slug: "rooted-and-built-live-intensive",
      programId: rootedAndBuilt.id,
      cohortId: cohort.id,
      title: "Rooted and Built Live Intensive",
      description:
        "A live weekend gathering for every Rooted and Built cohort member — worship, teaching, and Tribe time in person.",
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
      programId: rootedAndBuilt.id,
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
      programId: rootedAndBuilt.id,
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
      programId: rootedAndBuilt.id,
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
      programId: rootedAndBuilt.id,
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

  const resourceIdBySlug = new Map<string, string>();
  for (const r of resourceSeeds) {
    const created = await prisma.resource.upsert({
      where: { slug: r.slug },
      update: r,
      create: r,
    });
    resourceIdBySlug.set(r.slug, created.id);
  }

  // Attach a library resource to a lesson, demonstrating content reusability.
  const sonshipResourceId = resourceIdBySlug.get("walking-in-sonship");
  if (sonshipResourceId) {
    await prisma.lessonResource.upsert({
      where: { lessonId_resourceId: { lessonId: firstLessonId, resourceId: sonshipResourceId } },
      update: {},
      create: { lessonId: firstLessonId, resourceId: sonshipResourceId, order: 0 },
    });
  }

  // ── Announcements ────────────────────────────────────────────────────
  const announcementData = {
    title: "Rooted and Built Cohort One registration is open",
    body: "Rooted and Built Cohort One is now open for new members. Invite someone who's ready to be planted.",
    pinned: true,
  };
  await prisma.announcement.upsert({
    where: { id: "seed-announcement-1" },
    update: announcementData,
    create: { id: "seed-announcement-1", ...announcementData },
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
