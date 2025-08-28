'use client'

import { useState, useEffect } from 'react'
import quotes from '@/data/motivationalQuotes.json'

export default function MotivationalQuotes() {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false)
      
      setTimeout(() => {
        setCurrentQuoteIndex((prevIndex) => 
          (prevIndex + 1) % quotes.quotes.length
        )
        setIsVisible(true)
      }, 300) // Half of transition time
    }, 8000) // Change quote every 8 seconds

    return () => clearInterval(interval)
  }, [])

  const currentQuote = quotes.quotes[currentQuoteIndex]

  return (
    <div className="text-center max-w-2xl mx-auto py-8">
      <div 
        className={`transition-opacity duration-600 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <blockquote className="text-lg text-muted-foreground italic leading-relaxed mb-3">
          &ldquo;{currentQuote.text}&rdquo;
        </blockquote>
        <cite className="text-sm font-medium text-muted-foreground/80">
          — {currentQuote.author}
        </cite>
      </div>
      
      {/* Quote indicator dots */}
      <div className="flex justify-center gap-1 mt-4">
        {quotes.quotes.slice(0, 5).map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              index === (currentQuoteIndex % 5)
                ? 'bg-primary'
                : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  )
}