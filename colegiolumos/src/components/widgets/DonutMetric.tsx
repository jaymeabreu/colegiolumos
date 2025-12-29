
import { motion } from "framer-motion"
import { Users } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"

interface DonutMetricProps {
  title: string
  total: number
  active: number
  inactive: number
  onViewAll?: () => void
}

export function DonutMetric({ title, total, active, inactive, onViewAll }: DonutMetricProps) {
  const data = [
    { name: "Ativos", value: active, color: "#1e40af" },
    { name: "Inativos", value: inactive, color: "#fbbf24" }
  ]

  const CustomLabel = ({ cx, cy }: { cx: number; cy: number }) => (
    <text 
      x={cx} 
      y={cy} 
      textAnchor="middle" 
      dominantBaseline="middle" 
      className="fill-foreground font-bold text-2xl"
    >
      {total}
    </text>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            {title}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            Ver tudo
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={CustomLabel}
                  labelLine={false}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-700"></div>
              Ativos: {active}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              Inativos: {inactive}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
