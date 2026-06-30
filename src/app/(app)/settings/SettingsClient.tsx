"use client";

import { FormEvent, useState } from "react";
import type { SessionUser } from "@/types";

interface Props {
  user: SessionUser;
}

export function SettingsClient({ user }: Props) {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar ?? "");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");
  const [updatingPass, setUpdatingPass] = useState(false);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");
    setUpdatingProfile(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileSuccess("Profile updated successfully! Refreshing details...");
        // Delay page refresh to let user see success message
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setProfileError(data.error ?? "Failed to update profile.");
      }
    } catch {
      setProfileError("Network error. Please try again.");
    } finally {
      setUpdatingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPassSuccess("");
    setPassError("");

    if (newPassword !== confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }

    setUpdatingPass(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPassSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPassError(data.error ?? "Failed to update password.");
      }
    } catch {
      setPassError("Network error. Please try again.");
    } finally {
      setUpdatingPass(false);
    }
  }

  return (
    <div className="fade-in space-y-8">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your personal profile and account credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings Card */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Profile Information</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 text-sm">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {profileError}
              </div>
            )}

            <div className="form-group">
              <label className="label">Full Name</label>
              <input
                type="text"
                required
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">Avatar Image URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://example.com/avatar.jpg"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">Email Address (Cannot change)</label>
              <input
                type="email"
                disabled
                className="input bg-slate-50 cursor-not-allowed text-slate-400"
                value={user.email}
              />
            </div>

            <button type="submit" disabled={updatingProfile} className="btn-primary w-full">
              {updatingProfile ? "Updating Profile..." : "Save Profile Changes"}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Security & Password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 text-sm">
                {passSuccess}
              </div>
            )}
            {passError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                {passError}
              </div>
            )}

            <div className="form-group">
              <label className="label">Current Password</label>
              <input
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="input"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                required
                className="input"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={updatingPass} className="btn-primary w-full">
              {updatingPass ? "Updating Password..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
