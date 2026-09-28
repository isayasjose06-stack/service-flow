'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MoreHorizontal } from 'lucide-react';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/admin/services').then(res => setServices(res.data)).catch(() => {
      setServices([
        { id: '1', title: 'Fix Leaky Faucet', category: 'Plumbing', price: '$50', status: 'ACTIVE' },
        { id: '2', title: 'Install Ceiling Fan', category: 'Electrical', price: '$100', status: 'INACTIVE' },
      ]);
    });
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Services Listing</h1>
        <Button>Add Service</Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/services/${s.id}`} className="text-blue-600 hover:underline">{s.title}</Link>
                </TableCell>
                <TableCell className="text-slate-600">{s.category}</TableCell>
                <TableCell className="text-slate-600">{s.price}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(s.status)}>{s.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {services.map(s => (
          <Card key={s.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <Link href={`/admin/services/${s.id}`} className="font-medium text-blue-600 hover:underline text-lg">
                    {s.title}
                  </Link>
                  <div className="text-sm text-slate-500 mt-1">
                    {s.category} &bull; {s.price}
                  </div>
                </div>
                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
              </div>
              <div>
                <Badge variant={getStatusBadgeVariant(s.status)}>{s.status}</Badge>
              </div>
              <div className="pt-2">
                 <Button className="w-full" variant="outline" size="sm">
                   Edit Service
                 </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
