import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  Shield,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Key,
  UserCheck,
  UserX,
  Activity,
  Briefcase,
  DollarSign,
  TrendingUp,
} from "lucide-react";

interface User {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  countryCode: string;
  role: "super_admin" | "finance" | "sales" | "marketing";
  status: "active" | "inactive" | "pending";
  lastLogin: string;
  createdAt: string;
  permissions: string[];
}

const ROLES = {
  super_admin: {
    name: "Super Admin",
    color: "bg-red-100 text-red-800",
    icon: Shield,
    permissions: ["all"],
  },
  finance: {
    name: "Finance",
    color: "bg-green-100 text-green-800",
    icon: DollarSign,
    permissions: [
      "view_reports",
      "manage_payments",
      "view_bookings",
      "manage_vat",
    ],
  },
  sales: {
    name: "Sales",
    color: "bg-blue-100 text-blue-800",
    icon: TrendingUp,
    permissions: [
      "view_bookings",
      "manage_promos",
      "view_reports",
      "manage_markup",
    ],
  },
  marketing: {
    name: "Marketing",
    color: "bg-purple-100 text-purple-800",
    icon: Briefcase,
    permissions: ["manage_promos", "view_reports", "manage_content"],
  },
};

const PERMISSIONS = [
  { id: "view_dashboard", name: "View Dashboard", category: "General" },
  { id: "view_reports", name: "View Reports", category: "Analytics" },
  { id: "manage_users", name: "Manage Users", category: "Administration" },
  { id: "manage_bookings", name: "Manage Bookings", category: "Operations" },
  { id: "manage_payments", name: "Manage Payments", category: "Finance" },
  { id: "manage_promos", name: "Manage Promo Codes", category: "Marketing" },
  { id: "manage_markup", name: "Manage Markup", category: "Pricing" },
  { id: "manage_vat", name: "Manage VAT", category: "Finance" },
  { id: "manage_currency", name: "Manage Currency", category: "Settings" },
  { id: "manage_content", name: "Manage Content", category: "Marketing" },
  { id: "view_audit", name: "View Audit Logs", category: "Administration" },
  {
    id: "system_settings",
    name: "System Settings",
    category: "Administration",
  },
];

// Mock users data
const mockUsers: User[] = [
  {
    id: "1",
    title: "Mr",
    firstName: "Zubin",
    lastName: "Aibara",
    email: "zubin@faredown.com",
    phone: "+91 9876543210",
    address: "Mumbai, India",
    dateOfBirth: "1985-05-15",
    countryCode: "+91",
    role: "super_admin",
    status: "active",
    lastLogin: "2024-01-20T10:30:00Z",
    createdAt: "2023-01-01T00:00:00Z",
    permissions: ["all"],
  },
  {
    id: "2",
    title: "Ms",
    firstName: "Priya",
    lastName: "Sharma",
    email: "priya.finance@faredown.com",
    phone: "+91 9876543211",
    address: "Delhi, India",
    dateOfBirth: "1990-08-22",
    countryCode: "+91",
    role: "finance",
    status: "active",
    lastLogin: "2024-01-20T09:15:00Z",
    createdAt: "2023-03-15T00:00:00Z",
    permissions: [
      "view_reports",
      "manage_payments",
      "view_bookings",
      "manage_vat",
    ],
  },
  {
    id: "3",
    title: "Mr",
    firstName: "Raj",
    lastName: "Patel",
    email: "raj.sales@faredown.com",
    phone: "+91 9876543212",
    address: "Bangalore, India",
    dateOfBirth: "1988-12-10",
    countryCode: "+91",
    role: "sales",
    status: "active",
    lastLogin: "2024-01-19T14:45:00Z",
    createdAt: "2023-02-20T00:00:00Z",
    permissions: [
      "view_bookings",
      "manage_promos",
      "view_reports",
      "manage_markup",
    ],
  },
];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("list");

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesStatus =
      selectedStatus === "all" || user.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = () => {
    setFormData({
      title: "Mr",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      countryCode: "+91",
      role: "marketing",
      status: "active",
      permissions: [],
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({ ...user });
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (selectedUser) {
      // Update existing user
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id ? { ...u, ...formData } : u,
        ),
      );
      setIsEditDialogOpen(false);
    } else {
      // Create new user
      const newUser: User = {
        ...(formData as User),
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        lastLogin: "",
        permissions:
          ROLES[formData.role as keyof typeof ROLES]?.permissions || [],
      };
      setUsers([...users, newUser]);
      setIsCreateDialogOpen(false);
    }
    setFormData({});
    setSelectedUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((u) => u.id !== userId));
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(
      users.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === "active" ? "inactive" : "active" }
          : u,
      ),
    );
  };

  const UserForm = ({ isEdit = false }) => (
    <div className="space-y-6">
      {/* User Profile Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">User Profile</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Select
              value={formData.title}
              onValueChange={(value) =>
                setFormData({ ...formData, title: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select title" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mr">Mr</SelectItem>
                <SelectItem value="Ms">Ms</SelectItem>
                <SelectItem value="Mrs">Mrs</SelectItem>
                <SelectItem value="Dr">Dr</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName || ""}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              placeholder="Enter first name"
            />
          </div>

          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName || ""}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth || ""}
              onChange={(e) =>
                setFormData({ ...formData, dateOfBirth: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="countryCode">Country Code</Label>
            <Select
              value={formData.countryCode}
              onValueChange={(value) =>
                setFormData({ ...formData, countryCode: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="+91">+91 (India)</SelectItem>
                <SelectItem value="+1">+1 (USA)</SelectItem>
                <SelectItem value="+44">+44 (UK)</SelectItem>
                <SelectItem value="+971">+971 (UAE)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone || ""}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={formData.address || ""}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="Enter address"
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="userStatus"
            checked={formData.status === "active"}
            onCheckedChange={(checked) =>
              setFormData({
                ...formData,
                status: checked ? "active" : "inactive",
              })
            }
          />
          <Label htmlFor="userStatus">Active User</Label>
        </div>
      </div>

      {/* Login Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Login Details</h3>

        <div>
          <Label htmlFor="email">Email ID</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ""}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="Enter email address"
          />
        </div>

        {!isEdit && (
          <>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
              />
            </div>
          </>
        )}

        <div>
          <Label htmlFor="role">Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value) =>
              setFormData({ ...formData, role: value as User["role"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              {formData.role === "super_admin" && (
                <SelectItem value="super_admin">Super Admin</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const StatusBadge = ({ status }: { status: User["status"] }) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      inactive: { color: "bg-red-100 text-red-800", icon: XCircle },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            User List
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Create/Update User
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </div>
                <Button
                  onClick={handleCreateUser}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add User
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const roleConfig = ROLES[user.role];
                      const RoleIcon = roleConfig.icon;

                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                  {user.firstName.charAt(0)}
                                  {user.lastName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">
                                  {user.title} {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <Phone className="w-3 h-3 mr-1" />
                                {user.phone}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="w-3 h-3 mr-1" />
                                {user.address}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${roleConfig.color} flex items-center gap-1 w-fit`}
                            >
                              <RoleIcon className="w-3 h-3" />
                              {roleConfig.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={user.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Clock className="w-3 h-3 mr-1" />
                              {user.lastLogin
                                ? new Date(user.lastLogin).toLocaleDateString()
                                : "Never"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => toggleUserStatus(user.id)}
                                >
                                  {user.status === "active" ? (
                                    <>
                                      <UserX className="w-4 h-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-4 h-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Key className="w-4 h-4 mr-2" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600"
                                  disabled={user.role === "super_admin"}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Create New User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserForm />
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setFormData({})}>
                  Reset
                </Button>
                <Button onClick={handleSaveUser}>Save User</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          <UserForm isEdit={true} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
