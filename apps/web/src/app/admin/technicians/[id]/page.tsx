'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function TechnicianDetailPage() {
  const params = useParams();
  const [technician, setTechnician] = useState<any>(null);

  useEffect(() => {
    axios.get(`/api/admin/technicians/${params.id}`).then(res => setTechnician(res.data)).catch(() => {
      setTechnician({ id: params.id, name: 'Mike Fixit', email: 'mike@fixit.com', status: 'VERIFIED', joinedAt: '2023-01-15', documents: ['ID Card.pdf', 'Certification.pdf'] });
    });
  }, [params.id]);

  if (!technician) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/admin/technicians" className="text-blue-600 hover:underline mb-6 inline-block">&larr; Back to Technicians</Link>
      <div className="bg-white p-6 shadow-sm border rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Technician Details</h1>
        <div className="space-y-4">
          <div><div className="text-sm text-gray-500">Name</div><div className="font-medium">{technician.name}</div></div>
          <div><div className="text-sm text-gray-500">Email</div><div className="font-medium">{technician.email}</div></div>
          <div><div className="text-sm text-gray-500">Status</div><div className="font-medium">{technician.status}</div></div>
          <div>
            <div className="text-sm text-gray-500 mb-2">Documents</div>
            <ul className="list-disc pl-5">
              {technician.documents?.map((doc: string) => (
                <li key={doc} className="text-blue-600 hover:underline cursor-pointer">{doc}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
