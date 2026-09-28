'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/admin/service-requests').then(res => setRequests(res.data)).catch(() => {
      setRequests([
        { id: '1001', user: 'John Doe', service: 'Leaky Faucet', status: 'OPEN', createdAt: '2023-10-15' },
        { id: '1002', user: 'Jane Smith', service: 'Lightbulb replacement', status: 'IN_PROGRESS', createdAt: '2023-10-16' },
      ]);
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Service Requests</h1>
      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">User</th>
              <th className="p-4 font-medium">Service</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {requests.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="p-4"><Link href={`/admin/service-requests/${r.id}`} className="text-blue-600 hover:underline">{r.id}</Link></td>
                <td className="p-4">{r.user}</td>
                <td className="p-4">{r.service}</td>
                <td className="p-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{r.status}</span></td>
                <td className="p-4 text-gray-600">{r.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
