'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ServiceDetailPage() {
  const params = useParams();
  const [service, setService] = useState<any>(null);

  useEffect(() => {
    axios.get(`/api/admin/services/${params.id}`).then(res => setService(res.data)).catch(() => {
      setService({ id: params.id, title: 'Fix Leaky Faucet', category: 'Plumbing', subcategory: 'Pipe Repair', price: '$50', status: 'ACTIVE', description: 'Professional fix for any leaky faucet.' });
    });
  }, [params.id]);

  if (!service) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/admin/services" className="text-blue-600 hover:underline mb-6 inline-block">&larr; Back to Services</Link>
      <div className="bg-white p-6 shadow-sm border rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Service Details</h1>
        <div className="space-y-4">
          <div><div className="text-sm text-gray-500">Title</div><div className="font-medium">{service.title}</div></div>
          <div><div className="text-sm text-gray-500">Category</div><div className="font-medium">{service.category}</div></div>
          <div><div className="text-sm text-gray-500">Subcategory</div><div className="font-medium">{service.subcategory}</div></div>
          <div><div className="text-sm text-gray-500">Price</div><div className="font-medium">{service.price}</div></div>
          <div><div className="text-sm text-gray-500">Status</div><div className="font-medium">{service.status}</div></div>
          <div><div className="text-sm text-gray-500">Description</div><div className="mt-1 text-gray-800">{service.description}</div></div>
        </div>
      </div>
    </div>
  );
}
