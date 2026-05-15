"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "../src/components/layout/app-layout";
import Card from "../src/components/card";
import Icon from "../src/components/icon";
import { useTheme } from "../src/context/theme-context";
import { getMe } from "../src/api/auth.api";
import type { MeResponse } from "../src/types/auth";

// ── Toggle switch ──────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onChange}
      aria-label={ariaLabel}
      className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-[#4F6F52]" : "bg-slate-200 dark:bg-slate-600"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ── Section header inside a card ───────────────────────────────────────────────

function SectionHeader({
  title,
  description,
  dark,
}: {
  title: string;
  description?: string;
  dark: boolean;
}) {
  return (
    <div className="mb-5">
      <h2 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
        {title}
      </h2>
      {description && (
        <p className={`text-xs mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>
          {description}
        </p>
      )}
    </div>
  );
}

// ── Horizontal divider ─────────────────────────────────────────────────────────

function Divider({ dark }: { dark: boolean }) {
  return <hr className={`my-4 ${dark ? "border-neutral-800" : "border-slate-100"}`} />;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { dark, toggle } = useTheme();

  // Profile data
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setProfile)
      .catch((err) => console.error("getMe failed:", err))
      .finally(() => setProfileLoading(false));
  }, []);

  // Measurement unit state
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");

  // Notification toggles
  const [notifs, setNotifs] = useState({
    medicationReminders: true,
    weeklyReport: true,
    newFeatures: false,
    securityAlerts: true,
  });

  function toggleNotif(key: keyof typeof notifs) {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <AppLayout title="Settings">
      <div className="space-y-6 max-w-2xl">

        {/* ── Profile ──────────────────────────────────────────────────────── */}
        <Card>
          <SectionHeader
            title="Profile"
            description="Update your personal information."
            dark={dark}
          />

          <div className="space-y-3">
            {[
              { label: "Email", value: profileLoading ? "Loading…" : (profile?.email ?? "—") },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  {label}
                </span>
                <span className={`text-sm font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Appearance ───────────────────────────────────────────────────── */}
        <Card>
          <SectionHeader
            title="Appearance"
            description="Customize how MediLabel looks on your device."
            dark={dark}
          />

          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                Dark Mode
              </p>
              <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                Switch between light and dark theme.
              </p>
            </div>
            <Toggle checked={dark} onChange={toggle} ariaLabel="Toggle dark mode" />
          </div>

          <Divider dark={dark} />

          {/* Measurement units */}
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                Measurement Units
              </p>
              <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                Used across body metrics and workout data.
              </p>
            </div>
            <div
              className={`flex rounded-lg overflow-hidden border text-xs font-semibold ${
                dark ? "border-neutral-700" : "border-slate-200"
              }`}
            >
              {(["metric", "imperial"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-3 py-1.5 capitalize transition-colors ${
                    unit === u
                      ? "bg-[#4F6F52] text-white"
                      : dark
                      ? "bg-neutral-800 text-slate-400 hover:bg-neutral-700"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* ── Notifications ────────────────────────────────────────────────── */}
        <Card>
          <SectionHeader
            title="Notifications"
            description="Choose which alerts you receive."
            dark={dark}
          />

          <div className="space-y-4">
            {[
              {
                key: "medicationReminders" as const,
                label: "Medication Reminders",
                description: "Get notified when a dose is due.",
              },
              {
                key: "weeklyReport" as const,
                label: "Weekly Health Report",
                description: "A summary of your health activity each week.",
              },
              {
                key: "newFeatures" as const,
                label: "New Features",
                description: "Updates about new MediLabel capabilities.",
              },
              {
                key: "securityAlerts" as const,
                label: "Security Alerts",
                description: "Login and account-change notifications.",
              },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                    {label}
                  </p>
                  <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                    {description}
                  </p>
                </div>
                <Toggle
                  checked={notifs[key]}
                  onChange={() => toggleNotif(key)}
                  ariaLabel={`Toggle ${label}`}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* ── Privacy & Security ───────────────────────────────────────────── */}
        <Card>
          <SectionHeader
            title="Privacy & Security"
            description="Manage your password and data."
            dark={dark}
          />

          <div className="space-y-3">
            <button
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                dark
                  ? "border-neutral-700 text-slate-300 hover:bg-neutral-800"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon name="lock" className="text-base" />
                Change Password
              </span>
              <Icon name="chevron_right" className="text-base opacity-50" />
            </button>

            <button
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                dark
                  ? "border-neutral-700 text-slate-300 hover:bg-neutral-800"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon name="download" className="text-base" />
                Export My Data
              </span>
              <Icon name="chevron_right" className="text-base opacity-50" />
            </button>
          </div>
        </Card>

        {/* ── Legal / About ────────────────────────────────────────────────── */}
        <Card>
          <SectionHeader
            title="About"
            description="MediLabel AI platform information and legal links."
            dark={dark}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${dark ? "text-slate-400" : "text-slate-600"}`}>
                Version
              </span>
              <span className={`text-sm font-mono ${dark ? "text-slate-300" : "text-slate-700"}`}>
                v1.0.0
              </span>
            </div>

            <Divider dark={dark} />

            {[
              { label: "Terms of Service", href: "#" },
              { label: "Privacy Policy", href: "#" },
              { label: "Support", href: "#" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={`flex items-center justify-between text-sm font-medium transition-colors ${
                  dark
                    ? "text-slate-300 hover:text-white"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                {label}
                <Icon name="open_in_new" className="text-sm opacity-50" />
              </Link>
            ))}
          </div>
        </Card>

        {/* ── Danger Zone ──────────────────────────────────────────────────── */}
        <Card className={`border-red-200 ${dark ? "!border-red-900/50" : ""}`}>
          <SectionHeader
            title="Danger Zone"
            description="These actions are irreversible. Proceed with caution."
            dark={dark}
          />

          <div className="space-y-3">
            <button
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-red-200 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              onClick={() => {/* TODO: clear health data */}}
            >
              <span className="flex items-center gap-2">
                <Icon name="delete_sweep" className="text-base" />
                Clear All Health Data
              </span>
              <Icon name="chevron_right" className="text-base opacity-50" />
            </button>

            <button
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-red-200 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              onClick={() => {/* TODO: delete account */}}
            >
              <span className="flex items-center gap-2">
                <Icon name="person_off" className="text-base" />
                Delete Account
              </span>
              <Icon name="chevron_right" className="text-base opacity-50" />
            </button>

            <Link
              href="/logout"
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                dark
                  ? "border-neutral-700 text-slate-300 hover:bg-neutral-800"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon name="logout" className="text-base" />
              Sign Out
            </Link>
          </div>
        </Card>

      </div>
    </AppLayout>
  );
}
