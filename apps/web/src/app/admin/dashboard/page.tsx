'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Wrench, ClipboardList, Briefcase, ArrowRight, UserPlus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({ users: 0, technicians: 0, pendingRequests: 0, activeServices: 0 });

  useEffect(() => {
    // Mock API call
    axios.get('/api/admin/stats').then(res => setStats(res.data)).catch(() => {
      // Mock data on error
      setStats({ users: 1250, technicians: 145, pendingRequests: 42, activeServices: 341 });
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-slate-500 mt-2">Welcome to the ServiceFlow admin dashboard.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.users}</div>
            <p className="text-xs text-slate-500 mt-1">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Technicians</CardTitle>
            <Wrench className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.technicians}</div>
            <p className="text-xs text-slate-500 mt-1">+4% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Requests</CardTitle>
            <ClipboardList className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-slate-500 mt-1">Requires attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Services</CardTitle>
            <Briefcase className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeServices}</div>
            <p className="text-xs text-slate-500 mt-1">+18 new this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Perform common administrative tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link href="/admin/users" passHref>
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="mr-2 h-4 w-4" /> Manage Users
              </Button>
            </Link>
            <Link href="/admin/services" passHref>
              <Button variant="outline" className="w-full justify-start">
                <Briefcase className="mr-2 h-4 w-4" /> View Services
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" /> Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <span className="relative flex h-2 w-2 mr-3 rounded-full bg-blue-500"></span>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">New technician verified</p>
                    <p className="text-sm text-slate-500">Mike Fixit was approved by Admin.</p>
                  </div>
                  <div className="text-xs text-slate-400">2h ago</div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4" >
              <Link href="/admin/audit-logs">
                View all logs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
