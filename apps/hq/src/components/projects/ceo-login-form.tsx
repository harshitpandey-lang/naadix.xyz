"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CEOLoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/projects/ceo/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        setError("Invalid credentials");
        setIsLoading(false);
        return;
      }

      router.push("/projects");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-[var(--hq-panel)] border border-[var(--hq-line)] rounded-lg p-8">
        <h1 className="text-3xl font-bold text-[var(--hq-cream)] mb-2">
          CEO Portal
        </h1>
        <p className="text-[var(--hq-muted)] mb-8">
          Enter your credentials to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--hq-cream)] mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-[var(--hq)] border border-[var(--hq-line)] rounded text-[var(--hq-cream)] placeholder-[var(--hq-muted)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--hq-cream)] mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-[var(--hq)] border border-[var(--hq-line)] rounded text-[var(--hq-cream)] placeholder-[var(--hq-muted)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !formData.username || !formData.password}
            className="w-full mt-6 px-4 py-2 bg-[var(--accent)] text-white font-semibold rounded hover:opacity-90 disabled:opacity-50 transition"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
