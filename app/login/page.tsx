"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError("Faltan variables de entorno de Supabase en .env.local");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    if (mode === "signin") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      setStatus("Sesion iniciada. Redirigiendo...");
      router.replace("/dashboard");
      router.refresh();
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      setStatus("Cuenta creada y sesion iniciada.");
      router.replace("/dashboard");
      router.refresh();
      setLoading(false);
      return;
    }

    setStatus("Cuenta creada. Revisa tu correo para confirmar y luego inicia sesion.");
    setLoading(false);
  };

  return (
    <section className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-5">
      <h1 className="text-xl font-semibold text-white">Acceso con correo y contrasena</h1>
      <p className="mt-1 text-sm text-gray-400">
        Tu sesion queda abierta hasta que cierres sesion manualmente.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-border p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`rounded-md px-3 py-2 text-sm ${mode === "signin" ? "bg-accent font-semibold text-black" : "text-gray-300"}`}
        >
          Iniciar sesion
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-md px-3 py-2 text-sm ${mode === "signup" ? "bg-accent font-semibold text-black" : "text-gray-300"}`}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={handleLogin} className="mt-5 space-y-4">
        <label className="block text-sm text-gray-300">
          Correo
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@email.com"
            className="mt-1 w-full rounded-lg border border-border bg-[#111] px-3 py-2"
          />
        </label>
        <label className="block text-sm text-gray-300">
          Contrasena
          <input
            type="password"
            required
            value={password}
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimo 6 caracteres"
            className="mt-1 w-full rounded-lg border border-border bg-[#111] px-3 py-2"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
        >
          {loading ? "Procesando..." : mode === "signin" ? "Entrar" : "Crear cuenta"}
        </button>

        {status ? <p className="text-sm text-green-400">{status}</p> : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </form>
    </section>
  );
}