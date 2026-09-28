'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MoreHorizontal } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/admin/users').then(res => setUsers(res.data)).catch(() => {
      setUsers([
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'USER', status: 'ACTIVE' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'USER', status: 'BLOCKED' },
      ]);
    });
  }, []);

  const toggleBlock = (id: string, currentStatus: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' } : u));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'success';
      case 'BLOCKED': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
        <Button>Add User</Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/users/${u.id}`} className="text-blue-600 hover:underline">{u.name}</Link>
                </TableCell>
                <TableCell className="text-slate-600">{u.email}</TableCell>
                <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(u.status)}>{u.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant={u.status === 'ACTIVE' ? 'outline' : 'secondary'} 
                    size="sm" 
                    onClick={() => toggleBlock(u.id, u.status)}
                  >
                    {u.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.map(u => (
          <Card key={u.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-blue-600 hover:underline text-lg">
                    {u.name}
                  </Link>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </div>
                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{u.role}</Badge>
                <Badge variant={getStatusBadgeVariant(u.status)}>{u.status}</Badge>
              </div>
              <div className="pt-2">
                 <Button 
                    className="w-full"
                    variant={u.status === 'ACTIVE' ? 'outline' : 'secondary'} 
                    size="sm" 
                    onClick={() => toggleBlock(u.id, u.status)}
                  >
                    {u.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                  </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center text-sm text-slate-500">
        <div>Showing {users.length} entries</div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm" disabled>Next</Button>
        </div>
      </div>
    </div>
  );
}
