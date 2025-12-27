import { ParticipantLogin } from "@/components/participant-login"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ParticipantLoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4 py-2">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Participant Portal</h1>
                <p className="text-sm text-muted-foreground">Majlis Ansarullah Kenya</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle>Sign In to Your Account</CardTitle>
              <CardDescription>Enter your participant ID and email to access your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <ParticipantLogin />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
