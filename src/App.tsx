import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTeams from "./pages/AdminTeams";
import AdminTeamNew from "./pages/AdminTeamNew";
import AdminTeamEdit from "./pages/AdminTeamEdit";
import AdminTeamImport from "./pages/AdminTeamImport";
import AdminJudges from "./pages/AdminJudges";
import AdminJudgeNew from "./pages/AdminJudgeNew";
import AdminRanking from "./pages/AdminRanking";
import AdminSettings from "./pages/AdminSettings";
import AdminActions from "./pages/AdminActions";
import AdminWinners from "./pages/AdminWinners";
import PublicWinners from "./pages/PublicWinners";
import JudgeLogin from "./pages/JudgeLogin";
import JudgeTeams from "./pages/JudgeTeams";
import JudgeEvaluation from "./pages/JudgeEvaluation";
import AdminLayout from "./components/AdminLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Public Routes */}
          <Route path="/winners" element={<PublicWinners />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/actions" element={<AdminLayout><AdminActions /></AdminLayout>} />
          <Route path="/admin/teams" element={<AdminLayout><AdminTeams /></AdminLayout>} />
          <Route path="/admin/teams/new" element={<AdminLayout><AdminTeamNew /></AdminLayout>} />
          <Route path="/admin/teams/:id/edit" element={<AdminLayout><AdminTeamEdit /></AdminLayout>} />
          <Route path="/admin/teams/import" element={<AdminLayout><AdminTeamImport /></AdminLayout>} />
          <Route path="/admin/judges" element={<AdminLayout><AdminJudges /></AdminLayout>} />
          <Route path="/admin/judges/new" element={<AdminLayout><AdminJudgeNew /></AdminLayout>} />
          <Route path="/admin/ranking" element={<AdminLayout><AdminRanking /></AdminLayout>} />
          <Route path="/admin/winners" element={<AdminLayout><AdminWinners /></AdminLayout>} />
          <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
          
          {/* Judge Routes */}
          <Route path="/judge/login" element={<JudgeLogin />} />
          <Route path="/judge/teams" element={<JudgeTeams />} />
          <Route path="/judge/teams/:teamId" element={<JudgeEvaluation />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
