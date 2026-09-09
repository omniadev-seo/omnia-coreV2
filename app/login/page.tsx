import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-7">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Omnia Core</h1>
      <p className="mt-2 text-muted">Pilotage de la performance clients.</p>

      <form
        className="mt-8"
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/portefeuille" });
        }}
      >
        <button
          type="submit"
          className="w-full rounded-sm bg-ink px-4 py-3 text-surface hover:opacity-90"
        >
          Se connecter avec Google
        </button>
      </form>

      <p className="mt-4 text-xs text-muted">
        Seules les adresses autorisees peuvent acceder a l&apos;application.
      </p>
    </main>
  );
}
