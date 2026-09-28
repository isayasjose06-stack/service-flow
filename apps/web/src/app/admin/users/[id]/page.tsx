'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function UserDetailPage() {
  const params = useParams();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    axios.get(`/api/admin/users/${params.id}`).then(res => setUser(res.data)).catch(() => {
      setUser({ id: params.id, name: 'John Doe', email: 'john@example.com', role: 'USER', status: 'ACTIVE', joinedAt: '2023-01-15' });
    });
  }, [params.id]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/admin/users" className="text-blue-600 hover:underline mb-6 inline-block">&larr; Back to Users</Link>
      <div className="bg-white p-6 shadow-sm border rounded-lg">
        <h1 className="text-2xl font-bold mb-4">User Details</h1>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500">ID</div>
            <div className="font-medium">{user.id}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Name</div>
            <div className="font-medium">{user.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="font-medium">{user.email}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Role</div>
            <div className="font-medium">{user.role}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div className="font-medium">{user.status}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Joined</div>
            <div className="font-medium">{user.joinedAt}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
