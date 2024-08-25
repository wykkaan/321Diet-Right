import AdminNav from '@/components/AdminNav';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F5E9D4]">
      <AdminNav />
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}