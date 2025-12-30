import { OTPForm } from "@/components/otp-form"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense
          fallback={
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          }
        >
          <OTPForm />
        </Suspense>
      </div>
    </div>
  )
}

