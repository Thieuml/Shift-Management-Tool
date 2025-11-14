import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Shift Management</h1>
        <p className="text-lg mb-8">Manage shifts for lift engineers on the field</p>
        
        <nav className="space-y-4">
          <Link 
            href="/ops" 
            className="block p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Operations</h2>
            <p className="text-gray-600 dark:text-gray-400">View and manage operations</p>
          </Link>
          
          <Link 
            href="/admin" 
            className="block p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Admin</h2>
            <p className="text-gray-600 dark:text-gray-400">Administrative functions</p>
          </Link>
          
          <Link 
            href="/payroll" 
            className="block p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Payroll</h2>
            <p className="text-gray-600 dark:text-gray-400">Payroll management</p>
          </Link>
        </nav>
      </div>
    </main>
  )
}

