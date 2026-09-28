'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/admin/incidents').then(res => setIncidents(res.data)).catch(() => {
      setIncidents([
        { id: '1', request: 'REQ-1001', reportedBy: 'John Doe', status: 'OPEN', date: '2023-10-17' },
        { id: '2', request: 'REQ-1005', reportedBy: 'Tom Builder', status: 'RESOLVED', date: '2023-10-18' },
      ]);
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Incidents</h1>
      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4 font-medium">Request ID</th>
              <th className="p-4 font-medium">Reported By</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {incidents.map(i => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{i.request}</td>
                <td className="p-4">{i.reportedBy}</td>
                <td className="p-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{i.status}</span></td>
                <td className="p-4 text-gray-600">{i.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
