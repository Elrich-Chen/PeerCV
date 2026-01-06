"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_API_URL,
  normalizeUrl,
  setAuthSession,
} from "../auth";

const parseJsonResponse = async (response) => {
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = { detail: text };
    }
  }

  if (!response.ok) {
    const detail = data?.detail || data?.message;
    throw new Error(detail || `Request failed (${response.status})`);
  }

  return data;
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [loginIdentity, setLoginIdentity] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState("student");
  const [registerSchool, setRegisterSchool] = useState("");
  const [registerProgram, setRegisterProgram] = useState("");
  const [registerYear, setRegisterYear] = useState("");
  const [registerOrganization, setRegisterOrganization] = useState("");
  const [registerJobTitle, setRegisterJobTitle] = useState("");
  const [registerStep, setRegisterStep] = useState(1);
  const [loginStatus, setLoginStatus] = useState(null);
  const [registerStatus, setRegisterStatus] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const baseUrl = normalizeUrl(DEFAULT_API_URL);
  const toggleClass = (isActive) =>
    [
      isActive ? "btn-primary" : "btn-ghost",
      "rounded-full px-5",
    ].join(" ");
  const profileToggleClass = (isActive) =>
    [
      "rounded-full px-5 py-2 text-sm transition",
      isActive
        ? "bg-muted text-foreground border border-border"
        : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted",
    ].join(" ");

  const loginWithCredentials = async (identity, password) => {
    if (!baseUrl) {
      throw new Error("Enter an API base URL.");
    }

    const formBody = new URLSearchParams();
    formBody.set("username", identity);
    formBody.set("password", password);

    const response = await fetch(`${baseUrl}/auth/jwt/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody.toString(),
    });

    const data = await parseJsonResponse(response);
    const token = data?.access_token;
    if (!token) {
      throw new Error("Login response missing access token.");
    }
    return token;
  };

  const fetchUser = async (token) => {
    if (!baseUrl) {
      return null;
    }

    const response = await fetch(`${baseUrl}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return parseJsonResponse(response);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginStatus(null);

    if (!loginIdentity.trim() || !loginPassword) {
      setLoginStatus({
        type: "error",
        message: "Email and password are required.",
      });
      return;
    }

    try {
      setLoginLoading(true);
      const token = await loginWithCredentials(
        loginIdentity.trim(),
        loginPassword
      );
      const user = await fetchUser(token);
      setAuthSession(token, user);
      setLoginStatus({ type: "success", message: "Signed in." });
      router.push("/feed");
    } catch (error) {
      setLoginStatus({ type: "error", message: `Login failed: ${error.message}` });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setRegisterStatus(null);

    if (!registerUsername.trim() || !registerEmail.trim() || !registerPassword) {
      setRegisterStatus({
        type: "error",
        message: "Username, email, and password are required.",
      });
      return;
    }

    if (registerRole === "student") {
      if (
        !registerSchool.trim() ||
        !registerProgram.trim() ||
        !registerYear.trim()
      ) {
        setRegisterStatus({
          type: "error",
          message: "School, program, and year of study are required.",
        });
        return;
      }
    }

    if (registerRole === "professional") {
      if (!registerOrganization.trim() || !registerJobTitle.trim()) {
        setRegisterStatus({
          type: "error",
          message: "Organization and job title are required.",
        });
        return;
      }
    }

    if (!baseUrl) {
      setRegisterStatus({
        type: "error",
        message: "Enter an API base URL.",
      });
      return;
    }

    try {
      const payload = {
        email: registerEmail.trim(),
        password: registerPassword,
        username: registerUsername.trim(),
        profile_type: registerRole,
      };

      if (registerRole === "student") {
        payload.organization = registerSchool.trim();
        payload.program = registerProgram.trim();
        payload.year_of_study = registerYear.trim();
      }

      if (registerRole === "professional") {
        payload.organization = registerOrganization.trim();
        payload.job_title = registerJobTitle.trim();
      }

      setRegisterLoading(true);
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      await parseJsonResponse(response);
      setRegisterStatus({
        type: "success",
        message: "Account created. Signing you in...",
      });
      const token = await loginWithCredentials(
        registerEmail.trim(),
        registerPassword
      );
      const user = await fetchUser(token);
      setAuthSession(token, user);
      router.push("/feed");
    } catch (error) {
      setRegisterStatus({
        type: "error",
        message: `Registration failed: ${error.message}`,
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setRegisterStep(1);
    setLoginStatus(null);
    setRegisterStatus(null);
  };

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
          Account
        </p>
        <h1 className="text-3xl font-semibold text-foreground">
          Sign in or create a profile.
        </h1>
        <p className="text-sm text-muted-foreground">
          You can browse the community without signing in, but posting and commenting
          require an account.
        </p>
      </header>

      <div className="card space-y-6 px-5 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={toggleClass(mode === "login")}
            type="button"
            onClick={() => handleModeChange("login")}
          >
            Sign in
          </button>
          <button
            className={toggleClass(mode === "register")}
            type="button"
            onClick={() => handleModeChange("register")}
          >
            Create account
          </button>
        </div>

        {mode === "login" ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
                Login
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">
                Welcome back
              </h2>
            </div>
            <label className="space-y-2 text-sm text-muted-foreground">
              <span>Email</span>
              <input
                className="input"
                type="email"
                value={loginIdentity}
                onChange={(event) => setLoginIdentity(event.target.value)}
                placeholder="you@email.com"
              />
            </label>
            <label className="space-y-2 text-sm text-muted-foreground">
              <span>Password</span>
              <input
                className="input"
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
            </label>
            <button className="btn-primary" type="submit" disabled={loginLoading}>
              {loginLoading ? "Signing in..." : "Sign in"}
            </button>
            {loginStatus ? (
              <div
                className={`rounded-md border px-3 py-2 text-sm ${
                  loginStatus.type === "error"
                    ? "border-red-500/40 text-red-300"
                    : "border-emerald-500/40 text-emerald-300"
                }`}
              >
                {loginStatus.message}
              </div>
            ) : null}
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
                Register
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">
                Create an account
              </h2>
            </div>
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
              <span>Step {registerStep} of 2</span>
              <span>{registerStep === 1 ? "Account details" : "Profile details"}</span>
            </div>

            {registerStep === 1 ? (
              <>
                <label className="space-y-2 text-sm text-muted-foreground">
                  <span>Username</span>
                  <input
                    className="input"
                    value={registerUsername}
                    onChange={(event) => setRegisterUsername(event.target.value)}
                    placeholder="your-handle"
                  />
                </label>
                <label className="space-y-2 text-sm text-muted-foreground">
                  <span>Email</span>
                  <input
                    className="input"
                    type="email"
                    value={registerEmail}
                    onChange={(event) => setRegisterEmail(event.target.value)}
                    placeholder="you@email.com"
                  />
                </label>
                <label className="space-y-2 text-sm text-muted-foreground">
                  <span>Password</span>
                  <input
                    className="input"
                    type="password"
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                  />
                </label>
                <div className="flex justify-end">
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => {
                      if (
                        !registerUsername.trim() ||
                        !registerEmail.trim() ||
                        !registerPassword
                      ) {
                        setRegisterStatus({
                          type: "error",
                          message: "Username, email, and password are required.",
                        });
                        return;
                      }
                      setRegisterStatus(null);
                      setRegisterStep(2);
                    }}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
                    Profile type
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className={profileToggleClass(registerRole === "student")}
                      type="button"
                      onClick={() => setRegisterRole("student")}
                    >
                      Student
                    </button>
                    <button
                      className={profileToggleClass(registerRole === "professional")}
                      type="button"
                      onClick={() => setRegisterRole("professional")}
                    >
                      Professional
                    </button>
                  </div>
                </div>
                {registerRole === "student" ? (
                  <>
                    <label className="space-y-2 text-sm text-muted-foreground">
                      <span>School</span>
                      <input
                        className="input"
                        value={registerSchool}
                        onChange={(event) => setRegisterSchool(event.target.value)}
                        placeholder="e.g., Stanford University"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-muted-foreground">
                      <span>Program</span>
                      <input
                        className="input"
                        value={registerProgram}
                        onChange={(event) => setRegisterProgram(event.target.value)}
                        placeholder="e.g., Computer Science"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-muted-foreground">
                      <span>Year of study</span>
                      <select
                        className="input"
                        value={registerYear}
                        onChange={(event) => setRegisterYear(event.target.value)}
                      >
                        <option value="">Select year</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                      </select>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="space-y-2 text-sm text-muted-foreground">
                      <span>Organization</span>
                      <input
                        className="input"
                        value={registerOrganization}
                        onChange={(event) =>
                          setRegisterOrganization(event.target.value)
                        }
                        placeholder="e.g., Stripe"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-muted-foreground">
                      <span>Job title</span>
                      <input
                        className="input"
                        value={registerJobTitle}
                        onChange={(event) => setRegisterJobTitle(event.target.value)}
                        placeholder="e.g., Product Designer"
                      />
                    </label>
                  </>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    className="btn-ghost"
                    type="button"
                    onClick={() => setRegisterStep(1)}
                  >
                    Back
                  </button>
                  <button
                    className="btn-primary"
                    type="submit"
                    disabled={registerLoading}
                  >
                    {registerLoading ? "Creating..." : "Create account"}
                  </button>
                </div>
              </>
            )}
            {registerStatus ? (
              <div
                className={`rounded-md border px-3 py-2 text-sm ${
                  registerStatus.type === "error"
                    ? "border-red-500/40 text-red-300"
                    : "border-emerald-500/40 text-emerald-300"
                }`}
              >
                {registerStatus.message}
              </div>
            ) : null}
          </form>
        )}
      </div>
    </section>
  );
}
