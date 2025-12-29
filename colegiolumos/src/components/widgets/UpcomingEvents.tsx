
import { motion } from "framer-motion"
import { Calendar, Users, Gift } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { upcomingEvents } from "../../mocks/dashboard-data"
import { clsx } from "clsx"

const getEventIcon = (type: string) => {
  switch (type) {
    case 'birthday':
      return Gift
    case 'meeting':
      return Users
    default:
      return Calendar
  }
}

export function UpcomingEvents() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Próximos eventos</CardTitle>
          <Button variant="ghost" size="sm">
            Ver tudo
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingEvents.map((event) => {
            const Icon = getEventIcon(event.type)
            
            return (
              <div key={event.id} className="rounded-lg border border-border overflow-hidden hover:shadow-sm transition-shadow">
                <div className="p-3 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      event.color
                    )}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm leading-tight">{event.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{event.date}</p>
                    </div>
                  </div>
                </div>
                
                <div className="px-3 py-2 bg-muted/50 border-t border-border">
                  <span className="text-xs text-muted-foreground">{event.time}</span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}
