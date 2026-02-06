import { RouteObject } from "react-router-dom" 
import { LoginPage } from "../pages/login/page"
import { DiarioPage } from "../pages/diario/page"
import { HomePage } from "../pages/home/page"
import { NotFound } from "../pages/NotFound"
import { ProfessorLayout } from "../pages/professor/Layout"
import { AdminPage } from "../pages/admin/page"
import { AlunoLayout } from "../pages/aluno/layout"
import { AdminDashboard } from "../pages/admin/AdminDashboard"
import { Configuracoes } from "../pages/admin/Configuracoes"
import { ProtectedRoute } from "../components/auth/ProtectedRoute"

const routes: RouteObject[] = [
  {
    path: "/",
    element: <LoginPage />
  },
  {
    path: "/app/admin",
    element: (
      <ProtectedRoute requiredRole="COORDENADOR">
        <AdminPage />
      </ProtectedRoute>
    )
  },
  {
    path: "/app/admin/configuracoes",
    element: (
      <ProtectedRoute requiredRole="COORDENADOR">
        <Configuracoes />
      </ProtectedRoute>
    )
  },
  {
    path: "/app/professor",
    element: (
      <ProtectedRoute requiredRole="PROFESSOR">
        <ProfessorLayout />
      </ProtectedRoute>
    )
  },
  {
    path: "/app/aluno",
    element: (
      <ProtectedRoute requiredRole="ALUNO">
        <AlunoLayout />
      </ProtectedRoute>
    )
  },
  {
    path: "/app/diario",
    element: (
      <ProtectedRoute>
        <DiarioPage />
      </ProtectedRoute>
    )
  },
  {
    path: "/home",
    element: <HomePage />
  },
  {
    path: "*",
    element: <NotFound />
  }
]

export default routes
