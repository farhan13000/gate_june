import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { PageContainer } from "@/components/layout";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import Problems from "./pages/Problems";
import ProblemDetail from "./pages/ProblemDetail";
import PYQ from "./pages/PYQ";
import PYQProblems from "./pages/PYQProblems";
import Theory from "./pages/Theory";
import Contests from "./pages/Contests";
import ContestDetails from "./pages/ContestDetails";
import ContestRoom from "./pages/ContestRoom";
import Leaderboard from "./pages/Leaderboard";
import Discuss from "./pages/Discuss";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import AdminPanel from "./pages/AdminPanel";
import Announcements from "./pages/Announcements";

// Dashboard Imports
import DashboardLayout from "./dashboard/layout/DashboardLayout";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import PerformanceAnalytics from "./pages/dashboard/PerformanceAnalytics";
import SubjectProgress from "./pages/dashboard/SubjectProgress";
import SubjectDetail from "./pages/dashboard/SubjectDetail";
import ContestPerformance from "./pages/dashboard/ContestPerformance";
import DashboardLeaderboard from "./pages/dashboard/Leaderboard";
import SkillsDashboard from "./pages/dashboard/SkillsDashboard";
import ProblemAnalytics from "./pages/dashboard/ProblemAnalytics";
import LearningIntelligence from "./pages/dashboard/LearningIntelligence";

function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="site-main-shell">
        {isAdmin || isDashboard ? (
          children
        ) : (
          <PageContainer
            panelVariant={isAuthPage ? "auth" : "default"}
            className={
              isAuthPage
                ? "flex min-h-[calc(100vh-4rem)] items-center justify-center !py-6"
                : undefined
            }
          >
            {children}
          </PageContainer>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/pyq" element={<PYQ />} />
            <Route path="/pyq/:subjectId" element={<PYQProblems />} />
            <Route
              path="/problems/:id"
              element={
                <ProtectedRoute>
                  <ProblemDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/theory"
              element={
                <ProtectedRoute>
                  <Theory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contests"
              element={
                <ProtectedRoute>
                  <Contests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contests/:id/details"
              element={
                <ProtectedRoute>
                  <ContestDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contests/:id/practice"
              element={
                <ProtectedRoute>
                  <ContestRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contests/:id"
              element={
                <ProtectedRoute>
                  <ContestRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route index element={<Navigate to="overview" replace />} />
                      <Route path="overview" element={<DashboardOverview />} />
                      <Route path="performance" element={<PerformanceAnalytics />} />
                      <Route path="skills" element={<SkillsDashboard />} />
                      <Route path="problems" element={<ProblemAnalytics />} />
                      <Route path="learning-intelligence" element={<LearningIntelligence />} />
                      <Route path="subjects" element={<SubjectProgress />} />
                      <Route path="subjects/:subjectId" element={<SubjectDetail />} />
                      <Route path="contest-performance" element={<ContestPerformance />} />
                      <Route path="leaderboard" element={<DashboardLeaderboard />} />
                      <Route path="*" element={<Navigate to="overview" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/about" element={<Discuss />} />
            <Route path="/discuss" element={<Navigate to="/about" replace />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
);

export default App;
