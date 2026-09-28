'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/admin/verifications').then(res => setVerifications(res.data)).catch(() => {
      setVerifications([
        { id: '1', technicianName: 'Sara Wrenches', submittedAt: '2023-10-01', docs: 2 },
        { id: '2', technicianName: 'Tom Builder', submittedAt: '2023-10-02', docs: 1 },
      ]);
    });
  }, []);

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    setVerifications(verifications.filter(v => v.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Pending Verifications</h1>
      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4 font-medium">Technician</th>
              <th className="p-4 font-medium">Submitted At</th>
              <th className="p-4 font-medium">Docs Attached</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {verifications.map(v => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{v.technicianName}</td>
                <td className="p-4 text-gray-600">{v.submittedAt}</td>
                <td className="p-4 text-gray-600">{v.docs}</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleAction(v.id, 'approve')} className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700">Approve</button>
                  <button onClick={() => handleAction(v.id, 'reject')} className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700">Reject</button>
                </td>
              </tr>
            ))}
            {verifications.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">No pending verifications.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
