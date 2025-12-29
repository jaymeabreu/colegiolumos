
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { occurrences } from "../../mocks/dashboard-data"

export function OccurrencesList() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Ocorrências</CardTitle>
          <Button variant="ghost" size="sm">
            Ver tudo
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {occurrences.map((occurrence) => (
            <div key={occurrence.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
              <Avatar className="h-10 w-10">
                <AvatarImage src={occurrence.studentAvatar} />
                <AvatarFallback>
                  {occurrence.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{occurrence.studentName}</h4>
                  <Badge 
                    variant={occurrence.type === "Comportamento" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {occurrence.type}
                  </Badge>
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{occurrence.date}</p>
                  <p>Turma: {occurrence.class}</p>
                  <p>Adicionado por {occurrence.addedBy}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}
