"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download } from "lucide-react"
import { ReactNode } from "react"

type DownloadMenuProps = {
  onDownloadPdf: () => void
  onDownloadCsv?: () => void
  onDownloadExcel?: () => void
  triggerLabel?: ReactNode
}

export function DownloadMenu({ onDownloadPdf, onDownloadCsv, onDownloadExcel, triggerLabel }: DownloadMenuProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <Button variant="outline" onClick={onDownloadPdf} className="w-full sm:w-auto">
        <Download className="w-4 h-4 mr-2" />
        Download PDF
      </Button>
      <Button variant="outline" onClick={onDownloadExcel} className="w-full sm:w-auto">
        <Download className="w-4 h-4 mr-2" />
        Download Excel
      </Button>
    </div>
  )
}

export default DownloadMenu


