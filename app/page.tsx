import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center space-y-8 mb-16">
        <h1 className="text-5xl font-bold gradient-text">
          Welcome to Cascade Forum
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Join our community events and connect with like-minded individuals.
          Register for free or paid events and be part of something amazing.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/events">
            <Button size="lg" className="gradient-purple">
              Browse Events
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="lg" variant="outline">
              Get Started
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-16">
        <Card>
          <CardHeader>
            <CardTitle>Discover Events</CardTitle>
            <CardDescription>
              Explore a wide range of events tailored for our community
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Easy Registration</CardTitle>
            <CardDescription>
              Register for events with a simple, streamlined process
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Track Your Status</CardTitle>
            <CardDescription>
              Monitor your registration status and payment history
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
