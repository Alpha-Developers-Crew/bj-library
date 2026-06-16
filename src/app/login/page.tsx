"use client";

import { useState } from "react";
import { login, setupAdmin, getSecurityQuestion, resetPasswordWithQuestion } from "@/lib/actions/auth";
import { Eye, EyeOff, Library, LogIn, ShieldQuestion, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [setupMsg, setSetupMsg] = useState("");

  const [showForgot, setShowForgot] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotQuestion, setForgotQuestion] = useState("");
  const [forgotAnswer, setForgotAnswer] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result?.error) setError(result.error);
    } catch {
      setError("Login failed. Please try again.");
    }
    setLoading(false);
  };

  const handleForgotSearch = async () => {
    if (!forgotUsername.trim()) return;
    setForgotLoading(true); setForgotMsg("");
    try {
      const result = await getSecurityQuestion(forgotUsername);
      if (result.question) {
        setForgotQuestion(result.question);
      } else {
        setForgotMsg("No security question set for this account");
      }
    } catch { setForgotMsg("An error occurred"); }
    setForgotLoading(false);
  };

  const handleForgotReset = async () => {
    if (!forgotAnswer.trim()) return;
    setForgotLoading(true); setForgotMsg("");
    try {
      const result = await resetPasswordWithQuestion({ username: forgotUsername, answer: forgotAnswer });
      if (result?.error) { setForgotMsg(result.error); }
      else {
        setForgotMsg("✅ Password reset to admin/admin123. You can now login.");
        setForgotQuestion("");
        setForgotAnswer("");
      }
    } catch { setForgotMsg("An error occurred"); }
    setForgotLoading(false);
  };

  const handleSetup = async () => {
    setSetupMsg("");
    try {
      const result = await setupAdmin();
      setSetupMsg(result.message || "Done");
    } catch {
      setSetupMsg("Setup failed");
    }
  };

  const resetForgot = () => {
    setShowForgot(false);
    setForgotUsername("");
    setForgotQuestion("");
    setForgotAnswer("");
    setForgotMsg("");
  };

  return (
    <div className="min-h-screen flex bg-body">
      {/* Brand Section - Left */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(160deg, #080C1E 0%, #0A1028 25%, #0F1735 50%, #0C1126 75%, #080C1E 100%)" }}
      >
        {/* Bookshelf pattern - horizontal shelf lines */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 95px,
                rgba(212, 168, 83, 0.5) 95px,
                rgba(212, 168, 83, 0.5) 96px
              ),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 47px,
                rgba(212, 168, 83, 0.15) 47px,
                rgba(212, 168, 83, 0.15) 48px
              )
            `
          }}
        />

        {/* Warm lamp glow from center-right */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.12]"
            style={{
              background: "radial-gradient(ellipse at center, #D4A853 0%, transparent 70%)"
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/3 w-[300px] h-[300px] rounded-full opacity-[0.08]"
            style={{
              background: "radial-gradient(ellipse at center, #F5D98E 0%, transparent 60%)"
            }}
          />
        </div>

        {/* Floating particles (dust motes in warm light) */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div key={i}
              className="absolute rounded-full bg-primary"
              style={{
                width: `${((i * 7.3 + 13.7) % 1) * 3 + 1}px`,
                height: `${((i * 11.7 + 5.3) % 1) * 3 + 1}px`,
                left: `${10 + (i * 23.7 + 7.1) % 80}%`,
                top: `${5 + (i * 17.3 + 13.9) % 90}%`,
                opacity: 0.15 + ((i * 3.7 + 1.3) % 1) * 0.25,
                animation: `float ${8 + ((i * 5.7 + 2.3) % 1) * 12}s ease-in-out infinite`,
                animationDelay: `${((i * 7.1 + 3.7) % 1) * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Subtle bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48"
          style={{
            background: "linear-gradient(0deg, #080C1E 0%, transparent 100%)"
          }}
        />

        <div className="relative z-10 text-center px-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/15 backdrop-blur-sm rounded-3xl mb-8 border border-primary/25 shadow-2xl">
            <Library className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight mb-3">
            BJ Library
          </h1>
          <p className="text-text-secondary text-lg font-light max-w-md leading-relaxed">
            Premium study space management system — manage students, seats, fees, and renewals with ease.
          </p>
          <div className="mt-12 flex flex-col items-center gap-3">
            <div className="w-16 h-0.5 bg-primary/40 rounded-full" />
            <p className="text-text-muted text-sm">Library Management System</p>
          </div>
        </div>
      </div>

      {/* Form Section - Right */}
      <div className="flex-1 flex items-center justify-center p-6 bg-body relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxNDFCMzUiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6TTI0IDM0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0zMCAyMmMtMi4yMSAwLTQtMS43OS00LTRzMS43OS00IDQtNCA0IDEuNzkgNCA0LTEuNzkgNC00IDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="relative z-10 w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/15 rounded-2xl mb-4 border border-primary/25">
              <Library className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white">BJ Library</h1>
            <p className="text-text-secondary text-sm mt-1">Library Management System</p>
          </div>

          <div className="bg-surface rounded-2xl border border-border p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-1 h-7 bg-primary rounded-full" />
              <h2 className="text-xl font-semibold text-text">Welcome Back</h2>
            </div>

            {!showForgot ? (
              <>
                {error && (
                  <div className="bg-danger/15 border border-danger/25 text-danger px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 bg-[#FCA5A5] rounded-full flex-shrink-0" />
                    {error}
                  </div>
                )}

                {setupMsg && (
                  <div className="bg-success/10 border border-success/25 text-success px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full flex-shrink-0" />
                    {setupMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Username</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-body/60 border border-border-light rounded-xl text-text placeholder-[#5D6A8F] focus:outline-none focus:border-primary focus:ring-2 focus:ring-[#D4A853]/15 transition-all"
                      placeholder="Enter your username" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-body/60 border border-border-light rounded-xl text-text placeholder-[#5D6A8F] focus:outline-none focus:border-primary focus:ring-2 focus:ring-[#D4A853]/15 transition-all pr-10"
                        placeholder="Enter your password" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-primary to-primary-dark text-[#080C1E] py-3 rounded-xl font-semibold hover:from-primary-dark hover:to-[#A67A2A] disabled:opacity-50 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      <><LogIn className="w-4 h-4" /> Sign In</>
                    )}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <button onClick={() => setShowForgot(true)}
                    className="text-sm text-text-muted hover:text-primary transition-colors font-medium">
                    Forgot Password?
                  </button>
                </div>

                <div className="mt-5 pt-5 border-t border-border">
                  <button onClick={handleSetup}
                    className="w-full text-sm text-text-muted hover:text-primary transition-colors text-center font-medium">
                    First time? Setup admin account
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={resetForgot} className="text-text-muted hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-lg font-semibold text-text">Forgot Password</h3>
                </div>

                {forgotMsg && (
                  <div className={`mb-5 p-4 rounded-xl text-sm font-medium ${
                    forgotMsg.includes("✅") ? "bg-success/15 text-success border border-success/25" : "bg-danger/15 text-danger border border-danger/25"
                  }`}>{forgotMsg}</div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Username</label>
                    <input type="text" value={forgotUsername} onChange={(e) => setForgotUsername(e.target.value)}
                      disabled={!!forgotQuestion}
                      className="w-full px-4 py-3 bg-body/60 border border-border-light rounded-xl text-text placeholder-[#5D6A8F] focus:outline-none focus:border-primary focus:ring-2 focus:ring-[#D4A853]/15 transition-all disabled:opacity-50"
                      placeholder="Enter your username" />
                  </div>

                  {!forgotQuestion ? (
                    <button onClick={handleForgotSearch} disabled={forgotLoading || !forgotUsername.trim()}
                      className="w-full px-5 py-3 bg-gradient-to-r from-primary to-primary-dark text-[#080C1E] rounded-xl font-semibold hover:from-primary-dark hover:to-[#A67A2A] disabled:opacity-50 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                      <ShieldQuestion className="w-4 h-4" /> {forgotLoading ? "Checking..." : "Get Security Question"}
                    </button>
                  ) : (
                    <>
                      <div className="p-4 bg-hover/50 rounded-xl border border-border">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Security Question</p>
                        <p className="text-sm font-medium text-text">{forgotQuestion}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">Your Answer</label>
                        <input type="text" value={forgotAnswer} onChange={(e) => setForgotAnswer(e.target.value)}
                          className="w-full px-4 py-3 bg-body/60 border border-border-light rounded-xl text-text placeholder-[#5D6A8F] focus:outline-none focus:border-primary focus:ring-2 focus:ring-[#D4A853]/15 transition-all"
                          placeholder="Type your answer" />
                      </div>
                      <button onClick={handleForgotReset} disabled={forgotLoading || !forgotAnswer.trim()}
                        className="w-full px-5 py-3 bg-gradient-to-r from-primary to-primary-dark text-[#080C1E] rounded-xl font-semibold hover:from-primary-dark hover:to-[#A67A2A] disabled:opacity-50 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                        {forgotLoading ? "Resetting..." : "Reset Password"}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <p className="text-center text-xs text-text-muted mt-6">
            &copy; 2026 BJ Library Management System
          </p>
        </div>
      </div>
    </div>
  );
}
