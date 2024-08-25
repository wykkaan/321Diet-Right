import Link from 'next/link';

const AdminNav = () => {
  return (
    <nav className="bg-[#3C4E2A] text-white p-4">
      <ul className="flex space-x-4">
        <li>
          <Link href="/admin/dashboard" className="hover:text-[#F5E9D4]">
            Dashboard
          </Link>
        </li>
        <li>
          <Link href="/admin/users" className="hover:text-[#F5E9D4]">
            Users
          </Link>
        </li>
        <li>
          <Link href="/dashboard" className="hover:text-[#F5E9D4]">
            User Dashboard
          </Link>
        </li>
        <li>
          <Link href="/api/auth/signout" className="hover:text-[#F5E9D4]">
            Sign Out
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default AdminNav;