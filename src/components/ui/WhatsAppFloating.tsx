"use client"

import React from "react"
import { MessageCircle, User, Headset } from "lucide-react"
import { CONTACT_INFO } from "@/lib/constants"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"

export function WhatsAppFloating() {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
      <TooltipProvider>
        {CONTACT_INFO.admins.map((admin, idx) => (
          <Tooltip key={idx}>
            <TooltipTrigger asChild>
              <a
                href={`https://wa.me/${admin.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 border-2 border-white/10"
              >
                {idx === 0 ? (
                  <User className="h-6 w-6" />
                ) : (
                  <Headset className="h-6 w-6" />
                )}
              </a>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-black/90 border-white/10 text-white font-bold text-xs py-2 px-3 rounded-xl backdrop-blur-md">
              Chat: {admin.name}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  )
}
