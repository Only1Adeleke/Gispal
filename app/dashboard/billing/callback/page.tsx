"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function BillingCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const reference = searchParams.get("reference")
    const success = searchParams.get("success")

    if (success === "true" && reference) {
      verifyPayment(reference)
    } else {
      setStatus("error")
      setMessage("Payment was cancelled or failed")
    }
  }, [searchParams])

  const verifyPayment = async (reference: string) => {
    try {
      const response = await fetch("/api/billing/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      })

      if (response.ok) {
        setStatus("success")
        setMessage("Payment verified successfully! Your plan has been upgraded.")
      } else {
        const data = await response.json()
        setStatus("error")
        setMessage(data.error || "Payment verification failed")
      }
    } catch (error) {
      setStatus("error")
      setMessage("An error occurred while verifying payment")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
          <CardDescription>Processing your payment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-gray-600">Verifying payment...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
              <p className="text-gray-600 text-center mb-4">{message}</p>
              <Button onClick={() => router.push("/dashboard/billing")}>
                Go to Billing
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-8">
              <XCircle className="w-12 h-12 text-red-600 mb-4" />
              <p className="text-gray-600 text-center mb-4">{message}</p>
              <Button onClick={() => router.push("/dashboard/billing")}>
                Go to Billing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

