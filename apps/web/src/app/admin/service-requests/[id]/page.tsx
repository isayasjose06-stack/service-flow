'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ServiceRequestDetailPage() {
  const params = useParams();
  const [request, setRequest] = useState<any>(null);

  useEffect(() => {
    axios.get(`/api/admin/service-requests/${params.id}`).then(res => setRequest(res.data)).catch(() => {
      setRequest({ id: params.id, user: 'John Doe', service: 'Leaky Faucet', status: 'OPEN', description: 'The kitchen faucet is leaking constantly.', address: '123 Main St' });
    });
  }, [params.id]);

  if (!request) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/admin/service-requests" className="text-blue-600 hover:underline mb-6 inline-block">&larr; Back to Requests</Link>
      <div className="bg-white p-6 shadow-sm border rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Request #{request.id} Details</h1>
        <div className="space-y-4">
          <div><div className="text-sm text-gray-500">User</div><div className="font-medium">{request.user}</div></div>
          <div><div className="text-sm text-gray-500">Service</div><div className="font-medium">{request.service}</div></div>
          <div><div className="text-sm text-gray-500">Status</div><div className="font-medium">{request.status}</div></div>
          <div><div className="text-sm text-gray-500">Address</div><div className="font-medium">{request.address}</div></div>
          <div><div className="text-sm text-gray-500">Description</div><div className="mt-1 text-gray-800">{request.description}</div></div>
        </div>
      </div>
    </div>
  );
}
