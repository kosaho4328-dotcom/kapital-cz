import { createFileRoute } from "@tanstack/react-router";
import { Onboarding } from "@/components/onboarding";
import { AppShell } from "@/components/app-shell";
import { useGame } from "@/store/game-store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const game = useGame((s) => s.game);
  return game ? <AppShell /> : <Onboarding />;
}
