import React from 'react'
import { Button } from './base/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './base/card'
import { Badge } from './base/badge'

export function AppleComponentsShowcase() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="apple-text-display apple-text-gradient mb-4">
            Apple-Grade Components
          </h1>
          <p className="apple-text-subheading">
            Production-ready UI components with Apple Human Interface Guidelines
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Button Showcase */}
          <Card variant="elevated" className="apple-card-enter">
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Interactive button components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="default" size="default">
                Primary Button
              </Button>
              <Button variant="secondary" size="default">
                Secondary Button
              </Button>
              <Button variant="ghost" size="default">
                Ghost Button
              </Button>
            </CardContent>
          </Card>

          {/* Badge Showcase */}
          <Card variant="elevated" className="apple-card-enter">
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Status and label indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Error</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card Showcase */}
          <Card variant="elevated" className="apple-card-enter">
            <CardHeader>
              <CardTitle>Cards</CardTitle>
              <CardDescription>Container components</CardDescription>
            </CardHeader>
            <CardContent>
              <Card variant="default" size="sm">
                <CardContent className="p-4">
                  <p className="apple-text-caption">Nested card example</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}