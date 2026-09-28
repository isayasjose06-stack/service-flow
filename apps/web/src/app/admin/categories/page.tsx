'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/admin/categories').then(res => setCategories(res.data)).catch(() => {
      setCategories([
        { id: '1', name: 'Plumbing', active: true },
        { id: '2', name: 'Electrical', active: true },
        { id: '3', name: 'Cleaning', active: false },
      ]);
    });
  }, []);

  const toggleActive = (id: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Categories Management</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">Add Category</button>
      </div>
      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{c.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => toggleActive(c.id)} className="px-3 py-1 bg-gray-800 text-white rounded text-xs font-medium hover:bg-gray-700">
                    {c.active ? 'Deactivate' : 'Activate'}
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
