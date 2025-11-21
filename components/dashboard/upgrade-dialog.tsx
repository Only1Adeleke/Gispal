"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

export function UpgradeDialog() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleUpgrade = () => {
    setOpen(false)
    router.push("/dashboard/account")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Upgrade to Pro</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade to Pro</DialogTitle>
          <DialogDescription>
            Unlock all features with a Pro subscription
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Pro Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Up to 3 jingles per mix</li>
              <li>Full export (not just preview)</li>
              <li>Permanent file storage</li>
              <li>Unlimited cover arts</li>
              <li>Jingle position selection</li>
              <li>Volume control</li>
              <li>Use extracted cover art</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpgrade}>View Plans</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

