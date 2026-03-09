"use client";

import { useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return `${window.location.origin}/auth/callback`;
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    const supabase = createClient();
    if (!supabase) {
      setError("Faltan variables de entorno de Supabase en .env.local");
      return;
    }

    if (!callbackUrl) {
      setError("No se pudo construir la URL de callback.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl
      }
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setStatus("Te enviamos un enlace magico a tu correo.");
  };

  return (
    <section className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-5">
      <h1 className="text-xl font-semibold text-white">Iniciar sesion</h1>
      <p className="mt-1 text-sm text-gray-400">Accede con enlace magico de Supabase.</p>

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

        <button
          type="submit"
          className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
        >
          Enviar enlace
        </button>

        {status ? <p className="text-sm text-green-400">{status}</p> : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </form>
    </section>
  );
}