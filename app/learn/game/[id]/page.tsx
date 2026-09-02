import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GamePlayer } from "@/components/games/GamePlayer";
import { adaptPlayItems, mergeGameContent } from "@/lib/adapt-generated-game";

export const dynamic = "force-dynamic";

export default async function GamePlayPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const game = await prisma.game.findUnique({
    where: { id: params.id },
    include: {
      exerciseSet: true,
      flashcardData: { include: { pairs: true } },
      quizData: { include: { questions: true } },
      crosswordData: true,
      verbConjugationData: true,
      storyData: true,
    },
  });
  if (!game) notFound();

  const settings = mergeGameContent((game.settings ?? {}) as Record<string, any>, game);

  // For builder-created picture games, carry the uploaded images (stored on the
  // game's flashcard pairs) onto the play items so Picture-to-Word shows them.
  const pairImageByWord = new Map<string, string | null>();
  for (const p of game.flashcardData?.pairs ?? []) {
    if (p.word && p.imageUrl) pairImageByWord.set(p.word.toLowerCase(), p.imageUrl);
  }

  // Games own their content directly: on flashcard pairs, in settings JSON, or exerciseSet items.
  const rawItems = (settings as any).items || (settings as any).pairs || (settings as any).generated?.items;

  const pairItems =
    game.flashcardData?.pairs?.length
      ? game.flashcardData.pairs.map((p, idx) => ({
          id: `pair-${idx}`, word: p.word, translation: p.translation,
          audioUrl: p.audioUrl, imageUrl: pairImageByWord.get(p.word.toLowerCase()) ?? p.imageUrl, exampleSentence: p.exampleSentence,
        }))
      : Array.isArray(rawItems) && rawItems.length
        ? rawItems.map((p: any, idx: number) => ({
            id: `item-${idx}`,
            word: p.word || p.correctSentence || p.sentenceWithBlank || p.question || p.verb || p.term || "",
            translation: p.translation || p.correctWord || p.correctOption || p.clue || p.hint || p.definition || "",
            audioUrl: p.audioUrl || null,
            imageUrl: p.imageUrl || null,
            exampleSentence: p.exampleSentence || null,
          }))
        : Array.isArray(game.exerciseSet?.items) && (game.exerciseSet!.items as any[]).length
          ? (game.exerciseSet!.items as any[]).map((p: any, idx: number) => ({
              id: `es-${idx}`,
              word: p.word || p.term || p.front || "",
              translation: p.translation || p.definition || p.back || "",
              audioUrl: null,
              imageUrl: null,
              exampleSentence: p.exampleSentence || null,
            }))
          : [];

  // Access Control Security Check:
  // 1. Educator owner can always access and preview their game.
  // 2. If assigned to a class, user MUST be an active enrolled member of that class.
  const educatorProfile = await prisma.educatorProfile.findUnique({ where: { userId: session.user.id } });
  const isOwner = educatorProfile && educatorProfile.id === game.educatorId;

  if (!isOwner) {
    // Check if the game (or its parent course) is assigned to any class
    const assignments = await prisma.assignment.findMany({
      where: {
        OR: [
          { gameId: game.id },
          ...(game.courseId ? [{ game: { courseId: game.courseId } }] : []),
        ],
      },
      select: { classId: true },
    });

    if (assignments.length > 0) {
      const assignedClassIds = assignments.map((a) => a.classId);
      const isMember = await prisma.classMember.findFirst({
        where: {
          classId: { in: assignedClassIds },
          studentId: session.user.id,
        },
      });

      if (!isMember) {
        return (
          <div className="max-w-md mx-auto my-16 p-6 bg-card border border-border rounded-xl text-center space-y-4 shadow-md">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
              🔒
            </div>
            <h2 className="font-heading font-bold text-xl text-txt-primary">Access Restricted</h2>
            <p className="text-sm text-txt-secondary">
              This activity is private and assigned exclusively to enrolled class members. You are not currently enrolled in this class.
            </p>
          </div>
        );
      }
    } else if (!game.isPublished) {
      notFound();
    }
  }

  return (
    <GamePlayer
      gameId={game.id}
      title={game.title}
      type={game.type as any}
      items={adaptPlayItems(
        game.type as string,
        settings,
        pairItems
      )}
      settings={settings}
      student={{ name: session.user.name || "Student", image: session.user.image }}
    />
  );
}
