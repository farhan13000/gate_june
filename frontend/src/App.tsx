import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { PageContainer } from "@/components/layout";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import Problems from "./pages/Problems";
import ProblemDetail from "./pages/ProblemDetail";
import Theory from "./pages/Theory";
import Contests from "./pages/Contests";
import ContestDetails from "./pages/ContestDetails";
import ContestRoom from "./pages/ContestRoom";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import Discuss from "./pages/Discuss";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import AdminPanel from "./pages/AdminPanel";

function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="site-main-shell">
        {isAdmin ? (
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

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/problems" element={<Problems />} />
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
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/discuss" element={<Discuss />} />
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
