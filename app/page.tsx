
"use client";

import { useEffect, useState } from "react";

type Interview = {
  _id: string;
  title: string;
  role: string;
  experienceLevel: string;
  questions: string[];
  status: string;
  score: number | null;
};



export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [profile, setProfile] = useState<{
  name: string;
  email: string;
} | null>(null);
const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [search, setSearch] = useState("");
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Fresher");
  const [creating, setCreating] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [token, setToken] = useState<string | null>(null);
const [authMode, setAuthMode] = useState<"login" | "signup">("login");
const [authName, setAuthName] = useState("");
const [authEmail, setAuthEmail] = useState("");
const [authPassword, setAuthPassword] = useState("");
const [authLoading, setAuthLoading] = useState(false);
const [authError, setAuthError] = useState("");
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [answer, setAnswer] = useState("");
const [evaluation, setEvaluation] = useState<{ score: number; feedback: string; overallScore: number } | null>(null);
const [evaluating, setEvaluating] = useState(false);
const [showProfileMenu, setShowProfileMenu] = useState(false);
  useEffect(() => {
    const savedTheme = localStorage.getItem("interview-app-theme");

    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }

    setThemeLoaded(true);
  }, []);
  useEffect(() => {
  const savedToken = localStorage.getItem("interview-app-token");

  if (savedToken) {
    setToken(savedToken);
  }
}, []);

  useEffect(() => {
    if (!themeLoaded) return;

    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("interview-app-theme", theme);
  }, [theme, themeLoaded]);
  
useEffect(() => {
  if (!token) {
    setInterviews([]);
    setLoading(false);
    return;
  }

  async function fetchInterviews() {
    try {
      const response = await authFetch(
        "http://localhost:5000/api/v1/interviews"
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("interview-app-token");
          setToken(null);
          return;
        }

        throw new Error("Failed to fetch interviews.");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Failed to fetch interviews."
        );
      }

      setInterviews(result.data);
      setError("");
    } catch {
      setError(
        "Could not load interviews. Please check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  fetchInterviews();
}, [token]);

const authFetch = (url: string, options: RequestInit = {}) => {
  const savedToken =
    token || localStorage.getItem("interview-app-token");

  const headers = new Headers(options.headers);

  if (savedToken) {
    headers.set("Authorization", `Bearer ${savedToken}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

const handleAuthSubmit = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault();
  setAuthError("");
  setAuthLoading(true);

  try {
    const endpoint =
      authMode === "signup" ? "signup" : "login";

    const payload =
      authMode === "signup"
        ? {
            name: authName.trim(),
            email: authEmail.trim(),
            password: authPassword,
          }
        : {
            email: authEmail.trim(),
            password: authPassword,
          };

    const response = await authFetch(
      `http://localhost:5000/api/v1/auth/${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    console.log("LOGIN RESPONSE:", result);
    const userData = result.user;

if (userData) {
  setProfile({
    name: userData.name || "",
    email: userData.email || authEmail.trim(),
  });
}
    
const receivedToken = result.data?.token ?? result.token;

if (!response.ok || !result.success || !receivedToken) {
  throw new Error(
    result.message || "Authentication failed. No token received."
  );
}

localStorage.setItem("interview-app-token", receivedToken);
setToken(receivedToken);

    setAuthPassword("");
    setAuthError("");
  } catch (error) {
    setAuthError(
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again."
    );
  } finally {
    setAuthLoading(false);
  }
};
  const filteredInterviews = interviews.filter(
    (interview) =>
      interview.title.toLowerCase().includes(search.toLowerCase()) ||
      interview.role.toLowerCase().includes(search.toLowerCase())
  );
  async function handleCreateInterview(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setCreating(true);
    setFormMessage("");

    try {
     const formData = new FormData();

formData.append("title", title);
formData.append("role", role);
formData.append("experienceLevel", experienceLevel);

if (resumeFile) {
  formData.append("resume", resumeFile);
}

const response = await authFetch(
  "http://localhost:5000/api/v1/interviews",
  {
    method: "POST",
    body: formData,
  }
);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create interview.");
      }

      setInterviews((previous) => [result.data, ...previous]);
      setTitle("");
      setRole("");
      setExperienceLevel("Fresher");
      setShowForm(false);
      setFormMessage("Interview created successfully!");
    } catch (err) {
      setFormMessage(
        err instanceof Error
          ? err.message
          : "Could not create interview. Check your backend."
      );
    } finally {
      setCreating(false);
    }
  }
    async function handleDeleteInterview(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this interview?"
    );

    if (!confirmed) return;

    try {
      const response = await authFetch(
        `http://localhost:5000/api/v1/interviews/${id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete interview.");
      }

      setInterviews((previous) =>
        previous.filter((interview) => interview._id !== id)
      );

      setFormMessage("Interview deleted successfully!");
    } catch (err) {
      setFormMessage(
        err instanceof Error
          ? err.message
          : "Could not delete interview."
      );
    }
  }
  
const handleUpdateInterview = async (
  event: React.FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  if (!editingId) return;

  setUpdating(true);
  setFormMessage("");

  try {
    const response = await authFetch(
      `http://localhost:5000/api/v1/interviews/${editingId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          role,
          experienceLevel,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to update interview.");
    }

    setInterviews((previous) =>
      previous.map((interview) =>
        interview._id === editingId ? result.data : interview
      )
    );

    setEditingId(null);
    setTitle("");
    setRole("");
    setExperienceLevel("Fresher");
    setShowForm(false);
    setFormMessage("Interview updated successfully!");
  } catch (err) {
    setFormMessage(
      err instanceof Error ? err.message : "Something went wrong."
    );
  } finally {
    setUpdating(false);
  }
};

async function handleEvaluateAnswer() {
  if (!activeInterview || !activeAttemptId || !answer.trim()) {
    alert("Please enter your answer first.");
    return;
  }

  const question =
    activeInterview.questions[currentQuestionIndex];

  if (!question) {
    alert("No question found.");
    return;
  }

  setEvaluating(true);
  setEvaluation(null);

  try {
    const response = await authFetch(
      `http://localhost:5000/api/v1/interviews/${activeInterview._id}/evaluate-answer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          answer: answer.trim(),
          attemptId: activeAttemptId,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Could not evaluate your answer."
      );
    }

    setEvaluation(result.data);
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Something went wrong."
    );
  } finally {
    setEvaluating(false);
  }
}

function handleVoiceInput() {
  const SpeechRecognitionAPI =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    alert("Voice input is not supported. Please try Chrome.");
    return;
  }

  if (isListening) {
    (window as any).activeRecognition?.stop();
    setIsListening(false);
    return;
  }

  const recognition = new SpeechRecognitionAPI();

  (window as any).activeRecognition = recognition;

  recognition.lang = "en-IN";
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onstart = () => setIsListening(true);

  recognition.onresult = (event: any) => {
    let transcript = "";

    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript + " ";
    }

    setAnswer(transcript.trim());
  };

  recognition.onerror = (event: any) => {
    console.log("Speech recognition error:", event.error);
    setIsListening(false);
  };

  recognition.onend = () => {
    setIsListening(false);
    (window as any).activeRecognition = null;
  };

  recognition.start();
}

if (!token) {
  return (
<main className="flex min-h-screen items-center justify-center bg-[#f5f6f2] px-4 py-10">      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">
  InterviewPrep
</h1>

        <p className="mt-2 text-slate-500">
          {authMode === "login"
            ? "Welcome back! Log in to continue."
            : "Create an account to start practicing."}
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setAuthError("");
            }}
            className={`rounded-lg py-2 font-semibold ${
              authMode === "login"
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode("signup");
              setAuthError("");
            }}
            className={`rounded-lg py-2 font-semibold ${
              authMode === "signup"
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-slate-500"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
          {authMode === "signup" && (
            <input
              type="text"
              value={authName}
              onChange={(e) => setAuthName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            />
          )}

          <input
            type="email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-indigofocus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15-500"
          />

          <input
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            placeholder="Password (minimum 8 characters)"
            minLength={8}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-emerald-700"
          />

          {authError && (
            <p className="text-sm text-red-600">{authError}</p>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {authLoading
              ? "Please wait..."
              : authMode === "login"
                ? "Login"
                : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Practice today. Progress tomorrow.
        </p>
      </div>
    </main>
  );
}

  return (
    <main
  className={`min-h-screen ${
    theme === "dark"
      ? "bg-slate-950 text-white"
      : "bg-[#f8f9fc] text-slate-900"
  }`}
>

<div
  className={`flex items-center justify-between border-b px-6 py-3 ${
    theme === "dark"
      ? "border-slate-700 bg-slate-950"
      : "border-stone-200 bg-[#f5f6f2]"
  }`}
>
  <p
    className={`text-xs font-medium tracking-wide ${
      theme === "dark" ? "text-slate-400" : "text-stone-500"
    }`}
  >
    WORKSPACE SETTINGS
  </p>

  <button
    type="button"
    onClick={() =>
      setTheme((current) =>
        current === "light" ? "dark" : "light"
      )
    }
    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
      theme === "dark"
        ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
        : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
    }`}
  >
    {theme === "dark" ? (
      <>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.42 1.42" />
          <path d="m17.65 17.65 1.42 1.42" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.35 17.65-1.42 1.42" />
          <path d="m19.07 4.93-1.42 1.42" />
        </svg>
        Light appearance
      </>
    ) : (
      <>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
        </svg>
        Dark appearance
      </>
    )}
  </button>
</div>
{activeInterview && (
  <div className="mx-auto max-w-3xl p-6">
    <button
      onClick={() => {
        setActiveInterview(null);
        setActiveAttemptId(null);
        setAnswer("");
        setEvaluation(null);
      }}
      className="mb-6 rounded-lg border px-4 py-2"
    >
      ← Back to Dashboard
    </button>

    <div
  className={`rounded-2xl border p-6 shadow-sm ${
    theme === "dark"
      ? "border-slate-700 bg-slate-900 text-white"
      : "border-slate-200 bg-white text-slate-900"
  }`}
>
      <p className={`text-sm ${
  theme === "dark" ? "text-slate-400" : "text-stone-500"
}`}>
        {activeInterview.role} · {activeInterview.experienceLevel}
      </p>

      <h2 className="mt-2 text-2xl font-bold">
        AI Mock Interview
      </h2>

      <p className={`mt-4 text-sm ${
  theme === "dark" ? "text-slate-400" : "text-stone-500"
}`}>
        Question {currentQuestionIndex + 1} of{" "}
        {activeInterview.questions.length}
      </p>

      <h3 className="mt-3 text-lg font-semibold">
        {activeInterview.questions[currentQuestionIndex]}
      </h3>
      
      <button
        type="button"
        onClick={handleVoiceInput}
        disabled={!!evaluation || evaluating}
        className={`mt-5 rounded-lg px-4 py-2 font-medium text-white transition disabled:opacity-50 ${
  isListening
    ? "bg-red-700 hover:bg-red-800"
    : "bg-emerald-800 hover:bg-emerald-900"
}`}
      >
        {isListening ? "⏹ Stop Recording" : "🎤 Start Voice Input"}
      </button>

      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Type your answer here..."
        rows={6}
        className={`mt-5 w-full rounded-xl border p-4 text-sm outline-none transition-colors focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 ${
  theme === "dark"
    ? "border-slate-600 bg-slate-800 text-white placeholder:text-slate-400"
    : "border-stone-300 bg-white text-stone-900 placeholder:text-stone-400"
}`}
        disabled={!!evaluation || evaluating}
      />

      {!evaluation ? (
        <button
          onClick={handleEvaluateAnswer}
          disabled={evaluating || !answer.trim()}
          className="mt-4 rounded-lg bg-emerald-800 px-5 py-3 font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {evaluating ? "Evaluating with AI..." : "Submit Answer"}
        </button>
      ) : (
        <div
className={`mt-5 rounded-xl border p-5 ${
  theme === "dark"
    ? "border-slate-700 bg-slate-900 text-white"
    : "border-stone-200 bg-[#f5f6f2] text-stone-900"
}`}
>
          <h4 className="text-xl font-bold">
            Your Score: {evaluation.score}/100
          </h4>

          <p className="mt-2 font-semibold">AI Feedback</p>
          <p className="mt-1">{evaluation.feedback}</p>

          {currentQuestionIndex <
          activeInterview.questions.length - 1 ? (
            <button
              onClick={() => {
                setCurrentQuestionIndex((index) => index + 1);
                setAnswer("");
                setEvaluation(null);
              }}
className="mt-4 rounded-lg bg-emerald-800 px-5 py-3 font-semibold text-white transition hover:bg-emerald-900"            >
              Next Question →
            </button>
          ) : (
            
<button
  onClick={async () => {
    try {
      const response = await authFetch(
        `http://localhost:5000/api/v1/interviews/${activeInterview?._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        }
      );

      if (!response.ok) {
        throw new Error("Could not finish interview.");
      }

      const result = await response.json();

      setInterviews((previous) =>
        previous.map((item) =>
          item._id === activeInterview?._id
            ? { ...item, ...result.data }
            : item
        )
      );

      setActiveInterview(null);
      setActiveAttemptId(null);
      setAnswer("");
      setEvaluation(null);
      setCurrentQuestionIndex(0);
      setFormMessage("Interview completed! Your results are saved.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    }
  }}
  className="mt-4 rounded-lg bg-emerald-800 px-5 py-3 font-semibold text-white transition hover:bg-emerald-900"
>
  Finish Interview
</button>

          )}
        </div>
      )}
    </div>
  </div>
)}

      
<header
  className={`sticky top-0 z-10 border-b ${
    theme === "dark"
      ? "border-slate-700 bg-slate-950"
      : "border-stone-200 bg-white"
  }`}
>
  <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
    <a href="#dashboard" className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-800 text-white">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h3" />
        </svg>
      </div>

      <span
        className={`text-lg font-bold tracking-tight ${
          theme === "dark" ? "text-white" : "text-stone-900"
        }`}
      >
        InterviewPrep
      </span>
    </a>

    <nav
      aria-label="Main navigation"
      className={`hidden items-center gap-7 text-sm font-medium md:flex ${
        theme === "dark" ? "text-slate-300" : "text-stone-600"
      }`}
    >
      <a
        href="#dashboard"
        className="text-emerald-800 hover:text-emerald-900 dark:text-emerald-400"
      >
        Dashboard
      </a>
      <a
        href="#interviews"
        className="transition hover:text-emerald-800 dark:hover:text-emerald-400"
      >
        Interviews
      </a>
      <a
        href="#how-it-works"
        className="transition hover:text-emerald-800 dark:hover:text-emerald-400"
      >
        How it works
      </a>
    </nav>

    <div className="relative flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p
          className={`text-sm font-semibold ${
            theme === "dark" ? "text-white" : "text-stone-800"
          }`}
        >
          Welcome!
        </p>
        <p className="text-xs text-slate-500">
          Your interview workspace
        </p>
      </div>

      
<button
  type="button"
  onClick={() => setShowProfileMenu((prev) => !prev)}
  aria-label="Toggle profile menu"
  aria-expanded={showProfileMenu}
  className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-900 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
>

  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
  </svg>
</button>


{showProfileMenu && (
  <div
    className={`absolute right-0 top-12 z-50 w-64 rounded-xl border p-4 shadow-lg ${
      theme === "dark"
        ? "border-slate-700 bg-slate-900 text-white"
        : "border-stone-200 bg-white text-stone-900"
    }`}
  >
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      User Details
    </p>

<p className="text-sm font-semibold">
  {profile?.name || "Name not available"}
</p>

<p className="mt-1 break-all text-xs text-slate-500">
  {profile?.email || "Email not available"}
</p>

<div className="my-3 border-t border-stone-200 dark:border-slate-700" />

<button
      type="button"
      onClick={() => {
        setShowProfileMenu(false);
        localStorage.removeItem("interview-app-token");
        window.location.reload();
      }}
      className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
    >
      Log out
    </button>
  </div>
)}


    </div>
  </div>
</header>

      <div id="dashboard" className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
       
<section
  className={`rounded-2xl border p-7 sm:p-10 ${
    theme === "dark"
      ? "border-slate-700 bg-slate-900"
      : "border-stone-200 bg-[#f0f3ed]"
  }`}
>
  <div className="max-w-2xl">
    <p className="text-sm font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
      YOUR INTERVIEW WORKSPACE
    </p>

    <h1
      className={`mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-5xl ${
        theme === "dark" ? "text-white" : "text-stone-900"
      }`}
    >
      Prepare well.
      <br />
      Walk in with confidence.
    </h1>

    <p
      className={`mt-4 max-w-xl text-base leading-7 ${
        theme === "dark" ? "text-slate-300" : "text-stone-600"
      }`}
    >
      Practise role-specific interview questions, review your answers,
      and build confidence one session at a time.
    </p>

    <a
      href="#interviews"
      className="mt-7 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
    >
      Explore interviews
      <span aria-hidden="true">→</span>
    </a>
  </div>
</section>


       
<section className="mt-10 grid gap-5 sm:grid-cols-3">
  {[
    {
      icon: "01",
      title: "Personalized Practice",
      text: "Prepare with questions tailored to your target role.",
    },
    {
      icon: "02",
      title: "Voice Interviews",
      text: "Practise answering questions out loud.",
    },
    {
      icon: "03",
      title: "Performance Feedback",
      text: "Review your answers and identify areas to improve.",
    },
  ].map((item) => (
    <div
      key={item.title}
      className={`rounded-xl border p-6 transition-colors ${
        theme === "dark"
          ? "border-slate-700 bg-slate-900 hover:border-emerald-700"
          : "border-stone-200 bg-white hover:border-emerald-700"
      }`}
    >
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-sm font-semibold text-emerald-800">
        {item.icon}
      </div>

      <h2 className="font-semibold tracking-tight">
        {item.title}
      </h2>

      <p
        className={`mt-2 text-sm leading-6 ${
          theme === "dark" ? "text-slate-400" : "text-stone-600"
        }`}
      >
        {item.text}
      </p>
    </div>
  ))}
</section>


        <section id="interviews" className="mt-12">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold tracking-wider text-emerald-800 dark:text-emerald-400">
  GET STARTED
</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Practice interviews
              </h2>
              <p className="mt-2 text-slate-500">
                Choose an interview to start preparing.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
  <input
    type="search"
    value={search}
    onChange={(event) => setSearch(event.target.value)}
    placeholder="Search interviews..."
    aria-label="Search interviews"
    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 ${
  theme === "dark"
    ? "border-slate-700 bg-slate-900 text-white placeholder:text-slate-400"
    : "border-stone-300 bg-white text-stone-900 placeholder:text-stone-400"
}`}
  />

  <button
    type="button"
    onClick={() => {
      setShowForm(!showForm);
      setFormMessage("");
    }}
    className="rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white transition hover:bg-emerald-900"
  >
    + Create Interview
  </button>
</div>
          </div>
          {loading && (
            <p className="mt-6 text-slate-500">Loading interviews...</p>
          )}

          {error && (
            <p className="mt-6 text-red-600">{error}</p>
          )}
          {showForm && (
  <form
onSubmit={(event) =>
  editingId
    ? handleUpdateInterview(event)
    : handleCreateInterview(event)
}
className={`mt-5 rounded-xl border p-4 shadow-sm transition-colors ${
  theme === "dark"
    ? "border-slate-700 bg-slate-900 text-white"
    : "border-stone-200 bg-white text-stone-900"
}`}  >
    <h3 className="text-xl font-bold">
  {editingId ? "Edit interview" : "Create a new interview"}
</h3>
    <p className="mt-1 text-sm text-slate-500">
  {editingId
    ? "Update the details of your practice interview."
    : "Enter the details for your practice interview."}
</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-medium">
          Interview title
        </label>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. React Interview"
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-emerald-700 ${
  theme === "dark"
    ? "border-slate-600 bg-slate-800 text-white placeholder:text-slate-400"
    : "border-slate-200 bg-white text-slate-900"
}`}        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Job role
        </label>
        <input
          required
          value={role}
          onChange={(event) => setRole(event.target.value)}
          placeholder="e.g. Frontend Developer"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-700"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Experience level
        </label>
        <select
          value={experienceLevel}
          onChange={(event) => setExperienceLevel(event.target.value)}
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-emerald-700 ${
  theme === "dark"
    ? "border-slate-600 bg-slate-800 text-white"
    : "border-slate-200 bg-white text-slate-900"
}`}        >
          <option value="Fresher">Fresher</option>
          <option value="Junior">Junior</option>
          <option value="Mid-Level">Mid-Level</option>
          <option value="Senior">Senior</option>
        </select>
      </div>
    </div>
        <div className="mt-4">
      <label className="mb-2 block text-sm font-medium">
        Resume (PDF, optional)
      </label>

      <label
  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
    theme === "dark"
      ? "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
  }`}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M20 16.5v2A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-2" />
  </svg>

  Choose Resume PDF

  <input
    type="file"
    accept=".pdf,application/pdf"
    onChange={(event) =>
      setResumeFile(event.target.files?.[0] ?? null)
    }
    className="hidden"
  />
</label>

<p className="mt-2 text-sm text-slate-500">
  {resumeFile ? `Selected: ${resumeFile.name}` : "PDF only · Maximum size 5 MB"}
</p>

      <p className="mt-1 text-xs text-slate-500">
        Upload a text-based PDF up to 5 MB to personalize your interview questions.
      </p>
    </div>

    <button
      type="submit"
      disabled={creating}
      className="mt-5 rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white transition 
      hover:bg-emerald-900 disabled:opacity-50"
    >
  {editingId
    ? updating
      ? "Updating..."
      : "Update Interview"
    : creating
      ? "Creating..."
      : "Save Interview"}
    </button>
    <button
  type="button"
  onClick={() => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setRole("");
    setExperienceLevel("Fresher");
    setFormMessage("");
  }}
  className={`mt-5 ml-3 rounded-xl border px-5 py-3 font-semibold transition ${
    theme === "dark"
      ? "border-slate-600 text-slate-200 hover:bg-slate-800"
      : "border-stone-300 text-stone-700 hover:bg-stone-100"
  }`}
>
  Cancel
</button>
  </form>
)}

{formMessage && (
  <p
  className={`mt-4 text-sm ${
    theme === "dark" ? "text-emerald-400" : "text-emerald-800"
  }`}
  role="status"
>
  {formMessage}
</p>
)}
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredInterviews.map((interview) => (
              <article
                key={interview._id}
                className={`flex flex-col rounded-xl border p-5 transition-all duration-200 hover:border-emerald-700 hover:shadow-md ${
  theme === "dark"
    ? "border-slate-700 bg-slate-900 text-white"
    : "border-stone-200 bg-white text-stone-900"
}`}              >
                
<div className="flex items-start justify-between gap-3">
  <span
    
className={`rounded-md px-2.5 py-1 text-xs font-medium ${
  interview.status === "completed"
    ? theme === "dark"
      ? "bg-emerald-950 text-emerald-300"
      : "bg-emerald-50 text-emerald-800"
    : theme === "dark"
      ? "bg-stone-800 text-stone-300"
      : "bg-stone-100 text-stone-700"
}`}

  >
    {interview.status === "completed" ? "Completed" : "Draft"}
  </span>

<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="1.7"
  className="h-5 w-5 text-stone-400"
  aria-hidden="true"
>
  <rect x="5" y="3" width="14" height="18" rx="2" />
  <path d="M9 8h6M9 12h6M9 16h3" />
</svg>
</div>


                <h3 className="mt-5 text-lg font-semibold tracking-tight">
  {interview.title}
</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {interview.role} · {interview.experienceLevel}
                </p>

                
<div
  className={`mt-6 flex flex-wrap gap-3 border-t pt-4 text-xs ${
    theme === "dark"
      ? "border-slate-700 text-slate-400"
      : "border-stone-100 text-stone-500"
  }`}
>

<span className="inline-flex items-center gap-1.5">
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
  {interview.questions.length} questions
</span>
  <span>• AI-powered practice</span>
  {interview.score !== null && interview.score !== undefined && (
    
<span className="font-semibold text-emerald-800 dark:text-emerald-400">
  Score: {interview.score}/100
</span>

  )}
</div>


                <div className="mt-6 flex flex-wrap gap-2">
  <button
    type="button"
    
onClick={async () => {
  try {
    const attemptResponse = await authFetch(
      `http://localhost:5000/api/v1/interviews/${interview._id}/start-attempt`,
      { method: "POST" }
    );

    const attemptResult = await attemptResponse.json();

    if (!attemptResponse.ok || !attemptResult.success) {
      throw new Error(
        attemptResult.message || "Could not start interview attempt."
      );
    }

    setActiveAttemptId(attemptResult.data.attemptId);

    const response = await authFetch(
      `http://localhost:5000/api/v1/interviews/${interview._id}/generate-questions`,
      { method: "POST" }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Could not generate questions.");
    }

    setInterviews((previous) =>
      previous.map((item) =>
        item._id === interview._id ? result.data : item
      )
    );

    setActiveInterview(result.data);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentQuestionIndex(0);
    setAnswer("");
    setEvaluation(null);
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Something went wrong."
    );
  }
}}

    className="flex-1 rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white transition hover:bg-emerald-900"
  >
    Start practicing →
  </button>
  <button
  onClick={() => {
    setEditingId(interview._id);
    setTitle(interview.title);
    setRole(interview.role);
    setExperienceLevel(interview.experienceLevel);
    setShowForm(true);
    setFormMessage("");
  }}
className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
  theme === "dark"
    ? "border-slate-600 text-slate-200 hover:bg-slate-800"
    : "border-stone-300 text-stone-700 hover:bg-stone-100"
}`}
>
  Edit
</button>

  <button
    type="button"
    onClick={() => handleDeleteInterview(interview._id)}
    className="rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-50"
  >
    Delete
  </button>
</div>
              </article>
            ))}
          </div>

          {filteredInterviews.length === 0 && (
           <p
  className={`mt-8 rounded-xl border border-dashed p-8 text-center text-sm ${
    theme === "dark"
      ? "border-slate-700 text-slate-400"
      : "border-stone-300 text-stone-500"
  }`}
>
  No interviews found. Try another search.
</p>
          )}
        </section>

        <section
          id="how-it-works"
          className={`mt-12 rounded-2xl border p-7 sm:p-9 ${
  theme === "dark"
    ? "border-slate-700 bg-slate-900 text-white"
    : "border-slate-200 bg-white text-slate-900"
}`}        >
          <h2 className="text-2xl font-bold">How it works</h2>
          <p className="mt-2 text-slate-500">
            Three simple steps to become interview-ready.
          </p>

          <div className="mt-7 grid gap-7 md:grid-cols-3">
            {[
              { number: "01", title: "Choose your interview", text: "Select a role and the skills you want to practice." },
              { number: "02", title: "Talk to your AI coach", text: "Answer interview questions and explain your thinking." },
              { number: "03", title: "Review your feedback", text: "Discover strengths and areas you can improve." },
            ].map((step) => (
              <div key={step.number}>
                <p className="text-sm font-bold tracking-widest text-emerald-800 dark:text-emerald-400">
                  STEP {step.number}
                </p>
                <h3 className="mt-3 font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="py-10 text-center text-sm text-slate-500">
          InterviewPrep · Practice today. Progress tomorrow.
        </footer>
      </div>
    </main>
  );
}
