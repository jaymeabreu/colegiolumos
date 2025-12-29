
import { motion } from "framer-motion"
import { Card } from "../ui/card"
import { Badge } from "../ui/badge"

export function WelcomeBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-slate-800 dark:bg-slate-900 text-white border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Bem-vindo de volta, Thamiris Moraes
              <span className="text-lg">✏️</span>
            </h2>
            <p className="text-slate-300">Tenha um bom dia de trabalho.</p>
          </div>
          
          <Badge variant="secondary" className="bg-slate-700 text-slate-200 hover:bg-slate-600">
            Atualizado recentemente em 3 de maio de 2025
          </Badge>
        </div>
      </Card>
    </motion.div>
  )
}
