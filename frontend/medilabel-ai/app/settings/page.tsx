"use client";

import Link from "next/link";
import AppLayout from "../src/components/layout/app-layout";
import Card from "../src/components/card";
import Icon from "../src/components/icon";
import { useTheme } from "../src/context/theme-context";

// ── Reusable row inside a settings section ─────────────────────────────────────

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  const { dark } = useTheme();

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className={`text-sm font-medium ${dark ? "text-white" : "text-slate-900"}`}>
          {label}
        </p>
        {description && (
          <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 ml-6">{children}</div>
    </div>
  );
}

// ── Card wrapper for a settings section ───────────────────────────────────────

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const { dark } = useTheme();

  return (
    <Card>
      <div className="mb-3">
        <h2 className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
          {title}
        </h2>
        {description && (
          <p className={`text-xs mt-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>
            {description}
          </p>
        )}
      </div>
      <div className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
        {children}
      </div>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { dark, toggle } = useTheme();

  return (
    <AppLayout title="Settings">
      <div className="space-y-6 max-w-2xl">

        {/* Appearance */}
        <SettingsSection
          title="Appearance"
          description="Customize how MediLabel looks on your device."
        >
          <SettingRow
            label="Dark Mode"
            description="Switch between light and dark theme."
          >
            {/* Toggle switch */}
            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                dark ? "bg-indigo-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  dark ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </SettingRow>
        </SettingsSection>

        {/* Account */}
        <SettingsSection
          title="Account"
          description="Manage your session."
        >
          <SettingRow
            label="Email"
            description="Your login email address is stored securely."
          >
            <span
              className={`text-xs font-medium px-2 py-1 rounded-lg ${
                dark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"
              }`}
            >
              Stored securely
            </span>
          </SettingRow>

          <SettingRow
            label="Sign Out"
            description="Clear your session and return to the login screen."
          >
            <Link
              href="/logout"
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                dark
                  ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Icon name="logout" className="text-base" />
              Sign Out
            </Link>
          </SettingRow>
        </SettingsSection>

        {/* About */}
        <SettingsSection
          title="About"
          description="MediLabel AI platform information."
        >
          <SettingRow label="Version">
            <span className={`text-sm font-mono ${dark ? "text-slate-400" : "text-slate-500"}`}>
              v1.0.0
            </span>
          </SettingRow>

          <SettingRow label="Frontend">
            <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
              Next.js 15 / React 19
            </span>
          </SettingRow>

          <SettingRow label="Backend">
            <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
              FastAPI / Supabase
            </span>
          </SettingRow>

          <SettingRow label="ML Pipeline">
            <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
              HuggingFace Transformers / EasyOCR
            </span>
          </SettingRow>
        </SettingsSection>

      </div>
    </AppLayout>
  );
}
