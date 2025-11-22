import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Setup from "./pages/Setup";
import Gerenciamento from "./pages/Gerenciamento";
import EntityOptions from "./pages/EntityOptions";
import Alunos from "./pages/Alunos";
import Professores from "./pages/Professores";
import Aulas from "./pages/Aulas";
import AulasCadastro from "./pages/AulasCadastro";
import Administradores from "./pages/Administradores";
import Relatorios from "./pages/Relatorios";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/gerenciamento" element={<ProtectedRoute><Gerenciamento /></ProtectedRoute>} />
            <Route path="/options/:entity" element={<ProtectedRoute><EntityOptions /></ProtectedRoute>} />
            <Route path="/alunos" element={<ProtectedRoute><Alunos /></ProtectedRoute>} />
            <Route path="/professores" element={<ProtectedRoute><Professores /></ProtectedRoute>} />
          <Route path="/aulas" element={<ProtectedRoute><Aulas /></ProtectedRoute>} />
          <Route path="/aulas/cadastro" element={<ProtectedRoute><AulasCadastro /></ProtectedRoute>} />
            <Route path="/administradores" element={<ProtectedRoute><Administradores /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
