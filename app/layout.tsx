import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WeatherNext AI Intelligence',
  description: 'AI Weather Forecasting — Google DeepMind WeatherNext 2',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#030712', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  )
}
