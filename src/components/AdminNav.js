'use client'

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
          <Link href="/dashboard" className="hover:text-[#F5E9D4]">
            User Dashboard
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default AdminNav;