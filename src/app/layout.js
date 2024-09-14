import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import ConditionalNavigation from '@/components/ConditionalNavigation'
import AuthWrapper from '@/components/AuthWrapper'

export const metadata = {
  title: 'DietRight',
  description: 'Your personal diet and fitness companion',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#F5E9D4] text-[#3C4E2A]">
        <AuthProvider>
          <AuthWrapper>
            <main className="min-h-screen pb-16">
              {children}
            </main>
            <ConditionalNavigation />
          </AuthWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}