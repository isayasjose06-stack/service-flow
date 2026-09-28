'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MoreHorizontal } from 'lucide-react';

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/admin/technicians').then(res => setTechnicians(res.data)).catch(() => {
      setTechnicians([
        { id: '1', name: 'Mike Fixit', email: 'mike@fixit.com', status: 'VERIFIED' },
        { id: '2', name: 'Sara Wrenches', email: 'sara@wrenches.com', status: 'PENDING' },
      ]);
    });
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'VERIFIED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Technicians Management</h1>
        <Button>Add Technician</Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {technicians.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/technicians/${t.id}`} className="text-blue-600 hover:underline">{t.name}</Link>
                </TableCell>
                <TableCell className="text-slate-600">{t.email}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(t.status)}>{t.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {technicians.map(t => (
          <Card key={t.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <Link href={`/admin/technicians/${t.id}`} className="font-medium text-blue-600 hover:underline text-lg">
                    {t.name}
                  </Link>
                  <p className="text-sm text-slate-500">{t.email}</p>
                </div>
                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
              </div>
              <div>
                <Badge variant={getStatusBadgeVariant(t.status)}>{t.status}</Badge>
              </div>
              <div className="pt-2">
                 <Button className="w-full" variant="outline" size="sm">
                   View Details
                 </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
