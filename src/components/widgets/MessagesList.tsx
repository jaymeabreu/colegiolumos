
import { motion } from "framer-motion"
import { Paperclip } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { messages } from "../../mocks/dashboard-data"

export function MessagesList() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Últimas mensagens</CardTitle>
          <Button variant="ghost" size="sm">
            Ver tudo
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.senderAvatar} />
                <AvatarFallback>
                  {message.senderName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm truncate">{message.senderName}</h4>
                  <div className="flex items-center gap-1">
                    {message.hasAttachment && (
                      <Paperclip className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">{message.time}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate">{message.snippet}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}
