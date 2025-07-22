/**
 * User Management Admin Section
 * Complete user administration interface
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  CreditCard,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Smartphone,
  UserCheck,
  UserX,
  Crown,
  Star,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Mock user data
  const users = [
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+91 98765 43210",
      location: "Mumbai, India",
      joinDate: "2024-01-15",
      lastActive: "2 hours ago",
      status: "active",
      verified: true,
      loyaltyLevel: "Gold",
      totalBookings: 12,
      totalSpent: 245670,
      avgSaving: 18.5,
      preferredDestinations: ["Dubai", "London", "Paris"],
      paymentMethods: 2,
      deviceTypes: ["mobile", "desktop"],
    },
    {
      id: "2",
      name: "Sarah Wilson",
      email: "sarah.wilson@example.com",
      phone: "+91 87654 32109",
      location: "Delhi, India",
      joinDate: "2024-02-20",
      lastActive: "1 day ago",
      status: "active",
      verified: true,
      loyaltyLevel: "Silver",
      totalBookings: 8,
      totalSpent: 156789,
      avgSaving: 22.1,
      preferredDestinations: ["Singapore", "Bangkok", "Tokyo"],
      paymentMethods: 1,
      deviceTypes: ["mobile"],
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike.johnson@example.com",
      phone: "+91 76543 21098",
      location: "Bangalore, India",
      joinDate: "2024-03-10",
      lastActive: "5 mins ago",
      status: "suspended",
      verified: false,
      loyaltyLevel: "Bronze",
      totalBookings: 3,
      totalSpent: 45678,
      avgSaving: 12.3,
      preferredDestinations: ["Dubai", "Singapore"],
      paymentMethods: 1,
      deviceTypes: ["desktop", "mobile"],
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-red-100 text-red-800">
            <Ban className="w-3 h-3 mr-1" />
            Suspended
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getLoyaltyBadge = (level: string) => {
    switch (level) {
      case "Gold":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Crown className="w-3 h-3 mr-1" />
            Gold
          </Badge>
        );
      case "Silver":
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <Star className="w-3 h-3 mr-1" />
            Silver
          </Badge>
        );
      case "Bronze":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Star className="w-3 h-3 mr-1" />
            Bronze
          </Badge>
        );
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">
            Manage users, track activity, and handle account operations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import Users
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Full Name" />
                <Input placeholder="Email Address" />
                <Input placeholder="Phone Number" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Create User</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">15,420</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+12% this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Users
                </p>
                <p className="text-2xl font-bold">12,847</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-600">83.3% active rate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  New This Month
                </p>
                <p className="text-2xl font-bold">1,847</p>
              </div>
              <Plus className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-purple-500 mr-1" />
              <span className="text-sm text-purple-600">+8% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Verification Rate
                </p>
                <p className="text-2xl font-bold">94.2%</p>
              </div>
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-green-600">High verification</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name, email, or phone..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Users ({filteredUsers.length})</span>
            {selectedUsers.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedUsers.length} selected
                </span>
                <Button variant="outline" size="sm">
                  Bulk Actions
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input type="checkbox" className="rounded" />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Loyalty</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <input type="checkbox" className="rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            {user.verified ? (
                              <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500 mr-1" />
                            )}
                            {user.verified ? "Verified" : "Unverified"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="w-3 h-3 mr-1 text-gray-400" />
                          {user.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-3 h-3 mr-1 text-gray-400" />
                          {user.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                          {user.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{getLoyaltyBadge(user.loyaltyLevel)}</TableCell>
                    <TableCell>
                      <div className="text-center">
                        <p className="font-semibold">{user.totalBookings}</p>
                        <p className="text-xs text-gray-500">bookings</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <p className="font-semibold">
                          ₹{user.totalSpent.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600">
                          {user.avgSaving}% avg savings
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{user.lastActive}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        {user.deviceTypes.includes("mobile") && (
                          <Smartphone className="w-3 h-3 text-gray-400" />
                        )}
                        {user.deviceTypes.includes("desktop") && (
                          <Globe className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Activity className="w-4 h-4 mr-2" />
                            View Activity
                          </DropdownMenuItem>
                          {user.status === "active" ? (
                            <DropdownMenuItem className="text-red-600">
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-green-600">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Activate User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
