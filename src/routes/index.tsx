import { createFileRoute } from "@tanstack/react-router";
import { CairoIDE } from "@/components/cairo-ide";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return <CairoIDE />;
}
