import { useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import axios from "axios";
import Matrix from "./components/Matrix";
import TaskGenerator from "./components/TaskGenerator";
import Stats from "./components/Stats.tsx";

type Tab = "today" | "matrix" | "stats";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem("jwt");
  });
  const [activeTab, setActiveTab] = useState<Tab>("today");

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const res = await axios.post("http://localhost:5255/api/auth/login", {
        token: credentialResponse.credential,
      });
      localStorage.setItem("jwt", res.data.token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login failed to reach backend", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center max-w-sm w-full mx-4">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-8">
            Ohtani 9x9
          </h1>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.log("Google Login Failed")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sky Blue Header */}
      <header className="bg-[#0E95E8] shadow-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-center items-center relative">
          <h1 className="text-lg font-bold text-white tracking-wide">
            Ohtani 9x9
          </h1>

          {/* Profile / Logout Dropdown Button placed on the right */}
          <button
            onClick={handleLogout}
            className="absolute right-4 text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area - Scrollable */}
      <main className="flex-grow max-w-3xl mx-auto w-full px-4 py-6 pb-24">
        {activeTab === "today" && <TaskGenerator />}
        {activeTab === "matrix" && <Matrix />}
        {activeTab === "stats" && <Stats />}{" "}
        {/* Placeholder for your future Radar Chart */}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="bg-white border-t border-slate-200 fixed bottom-0 w-full z-20 pb-safe">
        <div className="max-w-3xl mx-auto flex justify-around items-center h-16">
          <button
            onClick={() => setActiveTab("today")}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === "today" ? "text-[#0E95E8]" : "text-slate-400 hover:text-slate-600"}`}
          >
            {/* Calendar Icon for Today */}
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Today
            </span>
          </button>

          <button
            onClick={() => setActiveTab("matrix")}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === "matrix" ? "text-[#0E95E8]" : "text-slate-400 hover:text-slate-600"}`}
          >
            {/* Grid Icon for Matrix */}
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              ></path>
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Matrix
            </span>
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === "stats" ? "text-[#0E95E8]" : "text-slate-400 hover:text-slate-600"}`}
          >
            {/* Pie Chart Icon for Stats */}
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              ></path>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              ></path>
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Stats
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
