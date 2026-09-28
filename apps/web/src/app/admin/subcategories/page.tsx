'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function SubcategoriesPage() {
  const [subcategories, setSubcategories] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/admin/subcategories').then(res => setSubcategories(res.data)).catch(() => {
      setSubcategories([
        { id: '1', categoryName: 'Plumbing', name: 'Pipe Repair', active: true },
        { id: '2', categoryName: 'Electrical', name: 'Wiring', active: true },
      ]);
    });
  }, []);

  const toggleActive = (id: string) => {
    setSubcategories(subcategories.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Subcategories Management</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">Add Subcategory</button>
      </div>
      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Subcategory Name</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subcategories.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-600">{s.categoryName}</td>
                <td className="p-4 font-medium">{s.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {s.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => toggleActive(s.id)} className="px-3 py-1 bg-gray-800 text-white rounded text-xs font-medium hover:bg-gray-700">
                    {s.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
