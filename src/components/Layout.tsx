import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function Layout() {
  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50">
      <Outlet />
      <BottomNav />
    </div>
  )
}
