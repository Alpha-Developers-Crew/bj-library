"use client";

import { useEffect, useState } from "react";
import { getProfile, updateProfile, changePassword, setSecurityQuestion } from "@/lib/actions/profile";
import { User, Lock, Save, ShieldQuestion } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<{ id: string; username: string; name: string; securityQuestion: string | null; hasSecurityQuestion: boolean } | null>(null);
  const [name, setName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [sqQuestion, setSqQuestion] = useState("");
  const [sqAnswer, setSqAnswer] = useState("");
  const [savingSq, setSavingSq] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const p = await getProfile();
        setProfile(p);
        setName(p.name);
        if (p.securityQuestion) setSqQuestion(p.securityQuestion);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMessage("");
    await updateProfile({ name });
    setMessage("Name updated successfully");
    setSaving(false);
  };

  const handleSetSecurityQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSq(true); setMessage("");
    const result = await setSecurityQuestion({ question: sqQuestion, answer: sqAnswer });
    if (result?.error) { setMessage(result.error); }
    else { setMessage("Security question saved"); setSqAnswer(""); }
    setSavingSq(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPwd(true); setMessage("");
    const result = await changePassword({ oldPassword, newPassword });
    if (result?.error) { setMessage(result.error); }
    else { setMessage("Password changed successfully"); setOldPassword(""); setNewPassword(""); }
    setChangingPwd(false);
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-xl mx-auto animate-fade-in space-y-6">
      <div className="bg-surface rounded-2xl border border-border p-7 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg shadow-primary/25">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">Profile</h2>
            <p className="text-sm text-text-muted">Manage your account</p>
          </div>
        </div>

        {message && (
          <div className={`mb-5 p-4 rounded-xl text-sm font-medium ${
            message.includes("success") || message.includes("saved")
              ? "bg-success/15 text-success border border-success/25"
              : "bg-danger/15 text-danger border border-danger/25"
          }`}>{message}</div>
        )}

        <div className="mb-6 p-4 bg-hover/50 rounded-xl border border-border">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Username</p>
          <p className="text-lg font-bold text-text">{profile?.username}</p>
        </div>

        <form onSubmit={handleUpdateName} className="space-y-4 mb-6 pb-6 border-b border-border">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" />
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 hover:from-primary-dark hover:to-primary transition-all duration-300 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
          </button>
        </form>

        <div className="mb-6 pb-6 border-b border-border">
          <h3 className="font-bold text-text mb-4 flex items-center gap-2">
            <ShieldQuestion className="w-4 h-4 text-text-muted" /> Security Question
          </h3>
          {profile?.hasSecurityQuestion ? (
            <div className="p-4 bg-hover/50 rounded-xl border border-border">
              <p className="text-sm text-text-muted mb-1">Current question:</p>
              <p className="text-sm font-medium text-text">{profile.securityQuestion}</p>
              <p className="text-xs text-text-muted mt-2">To change, set a new question and answer below.</p>
            </div>
          ) : (
            <p className="text-sm text-text-muted mb-3">Set a security question to recover your password if you forget it.</p>
          )}
          <form onSubmit={handleSetSecurityQuestion} className="space-y-3 mt-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Question</label>
              <select value={sqQuestion} onChange={(e) => setSqQuestion(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300">
                <option value="">— Select a question —</option>
                <option value="What is your pet's name?">What is your pet&apos;s name?</option>
                <option value="What is your mother's maiden name?">What is your mother&apos;s maiden name?</option>
                <option value="What was the name of your first school?">What was the name of your first school?</option>
                <option value="What is your favorite book?">What is your favorite book?</option>
                <option value="What city were you born in?">What city were you born in?</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Answer</label>
              <input type="text" value={sqAnswer} onChange={(e) => setSqAnswer(e.target.value)} placeholder="Your answer"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" />
            </div>
            <button type="submit" disabled={savingSq || !sqQuestion || !sqAnswer}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 hover:from-primary-dark hover:to-primary transition-all duration-300 disabled:opacity-50">
              <ShieldQuestion className="w-4 h-4" /> {savingSq ? "Saving..." : profile?.hasSecurityQuestion ? "Update Security Question" : "Set Security Question"}
            </button>
          </form>
        </div>

        <h3 className="font-bold text-text mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-text-muted" /> Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Current Password</label>
            <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-300" />
            <p className="text-xs text-text-muted mt-1">Minimum 6 characters</p>
          </div>
          <button type="submit" disabled={changingPwd}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-primary/25 hover:from-primary-dark hover:to-primary transition-all duration-300 disabled:opacity-50">
            <Lock className="w-4 h-4" /> {changingPwd ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
