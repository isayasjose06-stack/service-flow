'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/admin/audit-logs').then(res => setLogs(res.data)).catch(() => {
      setLogs([
        { id: '1', action: 'USER_LOGIN', user: 'admin@serviceflow.com', ip: '192.168.1.1', date: '2023-10-18 10:00:00' },
        { id: '2', action: 'BLOCK_USER', user: 'admin@serviceflow.com', target: 'jane@example.com', date: '2023-10-18 10:15:00' },
      ]);
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Audit Logs</h1>
      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4 font-medium">Action</th>
              <th className="p-4 font-medium">User</th>
              <th className="p-4 font-medium">Details / Target</th>
              <th className="p-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{l.action}</td>
                <td className="p-4">{l.user}</td>
                <td className="p-4 text-gray-600">{l.target || l.ip || '-'}</td>
                <td className="p-4 text-gray-600">{l.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
