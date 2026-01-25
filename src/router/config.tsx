import { RouteObject } from "react-router-dom"
import { LoginPage } from "../pages/login/page"
import { DiarioPage } from "../pages/diario/page"
import { HomePage } from "../pages/home/page"
import { NotFound } from "../pages/NotFound"
import { ProfessorPage } from "../pages/professor/page"
import { AdminPage } from "../pages/admin/page"
import { AlunoPage } from "../pages/aluno/page"
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
    ),
    children: [
      {
        path: "dashboard",
        element: <AdminDashboard />
      },
      {
        path: "diarios",
        element: <AdminPage />
      },
      {
        path: "configuracoes",
        element: <Configuracoes />
      }
    ]
  },
  {
    path: "/app/professor",
    element: (
      <ProtectedRoute requiredRole="PROFESSOR">
        <ProfessorPage />
      </ProtectedRoute>
    )
  },
  {
    path: "/app/aluno",
    element: (
      <ProtectedRoute requiredRole="ALUNO">
        <AlunoPage />
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
