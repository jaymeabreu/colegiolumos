
import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { calendarData } from "../../mocks/dashboard-data"
import { clsx } from "clsx"

export function MiniCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3, 20)) // April 2025
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const today = calendarData.today
  const eventDays = calendarData.eventDays

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Calendário</CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-base text-muted-foreground">
            {calendarData.currentMonth} {calendarData.currentYear}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((day) => (
              <div key={day} className="text-xs font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
            
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="p-2"></div>
            ))}
            
            {days.map((day) => (
              <button
                key={day}
                className={clsx(
                  "p-2 text-sm rounded-md hover:bg-accent transition-colors",
                  day === today && "bg-primary text-primary-foreground font-medium",
                  eventDays.includes(day) && day !== today && "bg-accent font-medium",
                )}
              >
                {day}
              </button>
            ))}
          </div>
          
          <Button className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar um evento
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
