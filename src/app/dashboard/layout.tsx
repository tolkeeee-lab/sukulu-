import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <div
        style={{
          display: 'flex',
          minHeight: 'calc(100vh - 56px)',
        }}
      >
        <Sidebar />
        <main
          style={{
            flex: 1,
            padding: '22px 24px',
            overflowY: 'auto',
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>
    </>
  )
}
