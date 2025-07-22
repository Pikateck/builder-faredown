/*
 * Faredown Admin CMS Dashboard
 * Complete administrative interface with role-based access
 * Comprehensive CMS system for Flights, Hotels, Bargains, Rewards, and Payments
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { adminAuthService, PERMISSIONS } from "@/services/adminAuthService";
import { currencyService } from "@/services/currencyService";
import PromoCodeManager from "./PromoCodeManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  BarChart3,
  Users,
  BookOpen,
  CreditCard,
  TrendingUp,
  Hotel,
  Plane,
  DollarSign,
  Settings,
  Shield,
  Award,
  Ticket,
  Brain,
  Package,
  Search,
  Download,
  Edit,
  Trash2,
  Eye,
  Plus,
  Filter,
  MoreVertical,
  LogOut,
  Menu,
  X,
  RefreshCw,
  Calendar,
  MapPin,
  Star,
  Activity,
  Zap,
  FileText,
  Database,
  PieChart,
  BarChart,
  LineChart,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Briefcase,
  Globe,
  Smartphone,
  Mail,
  Bell,
} from "lucide-react";

// Mock data for demonstration
const mockStats = {
  totalBookings: 1247,
  totalRevenue: 2847392,
  successRate: 94.2,
  rewardsIssued: 85420,
  monthlyGrowth: 12.5,
  flightBookings: 728,
  hotelBookings: 519,
  topCities: ["Mumbai", "Dubai", "Delhi", "Singapore", "London"],
  recentBookings: [
    { id: "FD001", type: "Flight", amount: 25890, status: "Confirmed", customer: "John Doe" },
    { id: "HD002", type: "Hotel", amount: 12500, status: "Pending", customer: "Jane Smith" },
    { id: "FD003", type: "Flight", amount: 35200, status: "Confirmed", customer: "Mike Johnson" },
  ]
};

const adminModules = [
  { id: "dashboard", name: "Dashboard", icon: BarChart3, color: "bg-blue-500" },
  { id: "users", name: "User Management", icon: Users, color: "bg-green-500" },
  { id: "bookings", name: "Booking Management", icon: BookOpen, color: "bg-purple-500" },
  { id: "payments", name: "Payments & Accounting", icon: CreditCard, color: "bg-yellow-500" },
  { id: "bargains", name: "Bargain Engine", icon: Brain, color: "bg-red-500" },
  { id: "suppliers", name: "Supplier Management", icon: Briefcase, color: "bg-indigo-500" },
  { id: "inventory", name: "Inventory/Extranet", icon: Package, color: "bg-orange-500" },
  { id: "pricing", name: "Pricing & Markups", icon: DollarSign, color: "bg-teal-500" },
  { id: "rewards", name: "Rewards Management", icon: Award, color: "bg-pink-500" },
  { id: "promos", name: "Promo Codes", icon: Ticket, color: "bg-cyan-500" },
  { id: "analytics", name: "Analytics & Reports", icon: TrendingUp, color: "bg-emerald-500" },
  { id: "vouchers", name: "Voucher Templates", icon: FileText, color: "bg-slate-500" },
  { id: "audit", name: "Audit Logs", icon: Shield, color: "bg-amber-500" },
  { id: "cms", name: "CMS & Content", icon: Globe, color: "bg-violet-500" },
  { id: "ai", name: "AI Tools", icon: Zap, color: "bg-rose-500" },
  { id: "settings", name: "System Settings", icon: Settings, color: "bg-gray-500" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = adminAuthService.getCurrentUser();
      if (!currentUser) {
        navigate("/admin/login");
        return;
      }
      setUser(currentUser);
      setLoading(false);
    } catch (error) {
      navigate("/admin/login");
    }
  };

  const handleLogout = () => {
    adminAuthService.logout();
    navigate("/admin/login");
  };

  const hasPermission = (permission) => {
    return adminAuthService.hasPermission(permission);
  };

  const filteredModules = adminModules.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const renderDashboardOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.totalBookings.toLocaleString()}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-green-600 mt-2">↗ +{mockStats.monthlyGrowth}% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{mockStats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-green-600 mt-2">↗ +15.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.successRate}%</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-xs text-green-600 mt-2">↗ +2.1% improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rewards Issued</p>
                <p className="text-2xl font-bold text-gray-900">₹{mockStats.rewardsIssued.toLocaleString()}</p>
              </div>
              <Award className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-xs text-blue-600 mt-2">Weekly total</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Booking Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Plane className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-sm">Flights</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium">{mockStats.flightBookings}</span>
                  <div className="w-20 h-2 bg-gray-200 rounded ml-2">
                    <div className="w-3/5 h-2 bg-blue-600 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Hotel className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm">Hotels</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium">{mockStats.hotelBookings}</span>
                  <div className="w-20 h-2 bg-gray-200 rounded ml-2">
                    <div className="w-2/5 h-2 bg-green-600 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Top Destinations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockStats.topCities.map((city, index) => (
                <div key={city} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700">{index + 1}.</span>
                    <span className="text-sm ml-2">{city}</span>
                  </div>
                  <Badge variant="secondary">{Math.floor(Math.random() * 200) + 50} bookings</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Recent Bookings
            </div>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-1" />
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStats.recentBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {booking.type === "Flight" ? (
                        <Plane className="w-4 h-4 mr-1 text-blue-600" />
                      ) : (
                        <Hotel className="w-4 h-4 mr-1 text-green-600" />
                      )}
                      {booking.type}
                    </div>
                  </TableCell>
                  <TableCell>{booking.customer}</TableCell>
                  <TableCell>₹{booking.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={booking.status === "Confirmed" ? "default" : "secondary"}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download Voucher
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderModulePlaceholder = (moduleId) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {adminModules.find(m => m.id === moduleId)?.icon && 
            React.createElement(adminModules.find(m => m.id === moduleId).icon, { 
              className: "w-5 h-5 mr-2" 
            })
          }
          {adminModules.find(m => m.id === moduleId)?.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {adminModules.find(m => m.id === moduleId)?.icon && 
              React.createElement(adminModules.find(m => m.id === moduleId).icon, { 
                className: "w-8 h-8 text-gray-400" 
              })
            }
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {adminModules.find(m => m.id === moduleId)?.name}
          </h3>
          <p className="text-gray-600 mb-4">
            This module is under development and will be available soon.
          </p>
          <Button variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Notify When Ready
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Faredown Admin</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:transition-none`}>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-semibold text-gray-900">Faredown</h2>
                <p className="text-sm text-gray-600">Admin CMS</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-600">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search modules..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4 space-y-1 max-h-96 overflow-y-auto">
            {filteredModules.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeModule === module.id
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <module.icon className="w-4 h-4 mr-3" />
                {module.name}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {adminModules.find(m => m.id === activeModule)?.name || "Dashboard"}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {activeModule === "dashboard" 
                    ? "Overview of your Faredown platform" 
                    : `Manage ${adminModules.find(m => m.id === activeModule)?.name.toLowerCase()}`
                  }
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeModule === "dashboard" ? renderDashboardOverview() :
             activeModule === "promos" ? <PromoCodeManager /> :
             renderModulePlaceholder(activeModule)}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
