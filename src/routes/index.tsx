import { createFileRoute } from "@tanstack/react-router";

function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">Skills</h1>
    </div>
  );
}

const Route = createFileRoute("/")({
  component: HomePage,
});

export { Route };
