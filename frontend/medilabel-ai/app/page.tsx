"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "./src/api/axios";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("/api/auth/login", { email, password });
      const token = response.data.access_token;
      localStorage.setItem("token", token); // store JWT
      router.push("/dashboard"); // redirect to dashboard
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 text-white p-8 rounded-lg shadow-lg w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>

        {error && (
          <p className="bg-red-700 text-white p-2 mb-4 rounded">{error}</p>
        )}

        <label className="block mb-2 font-semibold">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 mb-4 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="block mb-2 font-semibold">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 mb-6 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
