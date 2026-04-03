import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  Crown,
  Search,
  Plus,
  User,
  MoreHorizontal,
  Eye,
  Edit,
  Key,
  Trash2
} from 'lucide-react';

interface AdminManagementProps {
  adminKey: string;
}

export default function AdminManagement({ adminKey }: AdminManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Fetch admin accounts
  const { data: adminAccounts, isLoading: adminLoading, refetch: refetchAdmins } = useQuery({
    queryKey: [`/api/admin/accounts?adminKey=${adminKey}`],
    enabled: !!adminKey
  });

  // Filter admins based on search
  const filteredAdmins = ((adminAccounts as any) || []).filter((admin: any) => {
    const matchesSearch = admin.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Mutations
  const suspendAdminMutation = useMutation({
    mutationFn: async (adminId: number) => {
      const response = await apiRequest('POST', `/api/admin/suspend-admin/${adminId}?adminKey=${adminKey}`, {});
      return response;
    },
    onSuccess: () => {
      refetchAdmins();
      toast({
        title: "Success",
        description: "Admin status updated successfully",
      });
    }
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (adminId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/delete-admin/${adminId}?adminKey=${adminKey}`, {});
      return response;
    },
    onSuccess: () => {
      refetchAdmins();
      toast({
        title: "Success",
        description: "Admin account deleted successfully",
      });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (adminId: number) => {
      const response = await apiRequest('POST', `/api/admin/reset-password/${adminId}?adminKey=${adminKey}`, {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password reset successfully",
      });
    }
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage admin users and permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:hover:border-gray-500">
            <Shield className="w-4 h-4 mr-2" />
            Permissions
          </Button>
          <Button variant="outline" className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:hover:border-gray-500">
            <Users className="w-4 h-4 mr-2" />
            Custom Roles
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <Plus className="w-4 h-4 mr-2" />
            Add New User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/60 dark:to-blue-800/60 rounded-xl">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredAdmins.length}</p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/60 dark:to-green-800/60 rounded-xl">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredAdmins.filter((admin: any) => admin.isActive).length}</p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/60 dark:to-yellow-800/60 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredAdmins.filter((admin: any) => !admin.isActive).length}</p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/60 dark:to-purple-800/60 rounded-xl">
              <Crown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredAdmins.filter((admin: any) => admin.adminType === 'superadministrator').length}</p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Super Admins</p>
            </div>
          </div>
        </div>
      </div>

      {/* All Users Section */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Users</h3>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-50 dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {adminLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">Loading administrators...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <Shield className="mx-auto h-12 w-12 mb-4 opacity-50 text-gray-400 dark:text-gray-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No administrators found</h3>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating a new administrator.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin: any) => (
                  <tr key={admin.id} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 flex items-center justify-center shadow-sm">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {admin.firstName} {admin.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            {admin.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant="outline" 
                        className={
                          admin.adminType === 'superadministrator' 
                            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700"
                            : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700"
                        }
                      >
                        {admin.adminType === 'superadministrator' ? 'superadmin' : admin.adminType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => suspendAdminMutation.mutate(admin.id)}
                        disabled={suspendAdminMutation.isPending}
                        className={`
                          inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                          ${admin.isActive 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                          }
                          ${suspendAdminMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                        `}
                      >
                        <div className={`w-2 h-2 rounded-full mr-2 ${admin.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600 dark:text-gray-300">
                      {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 mx-auto">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-gray-900/50">
                          <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:bg-blue-50 dark:focus:bg-blue-900/30 focus:text-blue-700 dark:focus:text-blue-400">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:bg-green-50 dark:focus:bg-green-900/30 focus:text-green-700 dark:focus:text-green-400">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => resetPasswordMutation.mutate(admin.id)}
                            className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:bg-orange-50 dark:focus:bg-orange-900/30 focus:text-orange-700 dark:focus:text-orange-400"
                          >
                            <Key className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                          <DropdownMenuItem 
                            onClick={() => deleteAdminMutation.mutate(admin.id)}
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 focus:bg-red-50 dark:focus:bg-red-900/30"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}