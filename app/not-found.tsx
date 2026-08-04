export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="forte-mark text-2xl">𝑓𝑓</p>
      <h1 className="mt-4 font-display text-xl text-paper">
        Nothing here.
      </h1>
      <p className="mt-3 max-w-sm text-sm text-paper-dim">
        This link doesn&apos;t match a dashboard. Double-check the URL you
        were sent.
      </p>
    </main>
  );
}
