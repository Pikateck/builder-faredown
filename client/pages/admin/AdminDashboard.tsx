/**
 * Faredown Admin CMS Dashboard
 * Complete administrative interface for managing the platform
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { adminAuthService, PERMISSIONS } from "@/services/adminAuthService";
import { currencyService } from "@/services/currencyService";
import ReportingSystem from "./ReportingSystem";
import SupplierManagement from "./SupplierManagement";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BarChart3,
  Users,
  Plane,
  Hotel,
  DollarSign,
  Settings,
  FileText,
  Upload,
  Download,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Bell,
  Calendar,
  Filter,
  MoreHorizontal,
  Globe,
  Shield,
  Zap,
  Target,
  PieChart,
  Activity,
  Briefcase,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Image,
  Tag,
  Percent,
  Database,
  Cloud,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Calculator,
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [realtimeData, setRealtimeData] = useState({
    activeUsers: 247,
    activeBargains: 12,
    todayBookings: 89,
    todayRevenue: 245670,
  });

  // Check authentication and get user data
  useEffect(() => {
    const checkAuth = async () => {
      if (!adminAuthService.isAuthenticated()) {
        navigate("/admin/login");
        return;
      }

      try {
        const user = await adminAuthService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to get user data:", error);
        navigate("/admin/login");
      }
    };

    checkAuth();
  }, [navigate]);

  // Mock data for dashboard
  const dashboardStats = {
    totalUsers: 15420,
    activeUsers: 247,
    totalBookings: 8942,
    totalRevenue: 2456789,
    conversionRate: 12.4,
    avgBargainSavings: 18.7,
    topDestinations: [
      { name: "Dubai", bookings: 234, revenue: 456789 },
      { name: "London", bookings: 189, revenue: 378945 },
      { name: "Paris", bookings: 156, revenue: 298765 },
    ],
    recentActivity: [
      {
        id: 1,
        type: "booking",
        user: "John Doe",
        action: "Booked flight to Dubai",
        time: "2 mins ago",
        amount: 1250,
      },
      {
        id: 2,
        type: "bargain",
        user: "Sarah Wilson",
        action: "Successfully bargained hotel rate",
        time: "5 mins ago",
        savings: 180,
      },
      {
        id: 3,
        type: "user",
        user: "Mike Johnson",
        action: "New user registration",
        time: "8 mins ago",
      },
    ],
  };

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealtimeData((prev) => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 5),
        activeBargains: prev.activeBargains + Math.floor(Math.random() * 3 - 1),
        todayBookings: prev.todayBookings + Math.floor(Math.random() * 2),
        todayRevenue: prev.todayRevenue + Math.floor(Math.random() * 1000),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle navigation with mobile menu close
  const handleNavigation = (section: string) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">
                  Faredown Admin CMS
                </h1>
                <p className="text-sm text-gray-500">
                  Complete Platform Management
                </p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900">Admin CMS</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">Demo Mode</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    3
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Recent Notifications</h3>
                  <div className="space-y-2">
                    <div className="p-2 bg-yellow-50 rounded">
                      <p className="text-sm font-medium">High Volume Alert</p>
                      <p className="text-xs text-gray-600">
                        Unusual booking activity detected
                      </p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-sm font-medium">System Update</p>
                      <p className="text-xs text-gray-600">
                        Bargain engine optimized
                      </p>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">ZA</span>
                  </div>
                  <span className="text-sm font-medium">Zubin Aibara</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Shield className="w-4 h-4 mr-2" />
                  Security
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <nav
          className={`
          w-64 bg-white shadow-sm h-screen sticky top-0 z-50 transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
          fixed lg:relative
        `}
        >
          <div className="p-4">
            {/* Mobile Menu Close Button */}
            <div className="flex justify-between items-center mb-4 lg:hidden">
              <span className="text-lg font-semibold">Navigation</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-2">
              <Button
                variant={activeSection === "overview" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleNavigation("overview")}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard Overview
              </Button>

              {/* User Management - Restricted */}
              {adminAuthService.hasPermission(PERMISSIONS.USER_VIEW) && (
                <Button
                  variant={activeSection === "users" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation("users")}
                >
                  <Users className="w-4 h-4 mr-2" />
                  User Management
                </Button>
              )}

              {/* Booking Management */}
              {adminAuthService.hasPermission(PERMISSIONS.BOOKING_VIEW) && (
                <Button
                  variant={activeSection === "bookings" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation("bookings")}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Booking Management
                </Button>
              )}

              {/* Payment Dashboard - Finance Department */}
              {(adminAuthService.hasPermission(PERMISSIONS.FINANCE_VIEW) ||
                adminAuthService.canAccessDepartment("Accounts")) && (
                <Button
                  variant={activeSection === "payments" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation("payments")}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payment & Accounting
                </Button>
              )}

              {/* Bargain Engine */}
              {adminAuthService.hasPermission(PERMISSIONS.BARGAIN_VIEW) && (
                <Button
                  variant={activeSection === "bargain" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation("bargain")}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Bargain Engine
                </Button>
              )}

              {/* Supplier Management */}
              {(adminAuthService.hasPermission(PERMISSIONS.INVENTORY_VIEW) ||
                adminAuthService.isSuperAdmin()) && (
                <Button
                  variant={activeSection === "suppliers" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation("suppliers")}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Supplier Management
                </Button>
              )}

              {/* Inventory Management */}
              {adminAuthService.hasPermission(PERMISSIONS.INVENTORY_VIEW) && (
                <Button
                  variant={activeSection === "inventory" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation("inventory")}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Inventory Management
                </Button>
              )}

              {/* Extranet System */}
              {adminAuthService.hasPermission(PERMISSIONS.INVENTORY_UPLOAD) && (
                <Button
                  variant={activeSection === "extranet" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation("extranet")}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Extranet System
                </Button>
              )}

              {/* Pricing & Markups */}
              <Button
                variant={activeSection === "pricing" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleNavigation("pricing")}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Pricing & Markups
              </Button>

              {/* Settlement Reports */}
              {(adminAuthService.hasPermission(PERMISSIONS.FINANCE_VIEW) ||
                adminAuthService.canAccessDepartment("Accounts")) && (
                <Button
                  variant={
                    activeSection === "settlements" ? "default" : "ghost"
                  }
                  className="w-full justify-start"
                  onClick={() => handleNavigation("settlements")}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Settlement Reports
                </Button>
              )}

              {/* Transaction Logs */}
              {adminAuthService.hasPermission(PERMISSIONS.PAYMENT_VIEW) && (
                <Button
                  variant={
                    activeSection === "transactions" ? "default" : "ghost"
                  }
                  className="w-full justify-start"
                  onClick={() => handleNavigation("transactions")}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Transaction Logs
                </Button>
              )}

              {/* Promo Codes & Campaigns */}
              <Button
                variant={activeSection === "promotions" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleNavigation("promotions")}
              >
                <Tag className="w-4 h-4 mr-2" />
                Promo Codes
              </Button>

              {/* Advanced Analytics */}
              <Button
                variant={activeSection === "analytics" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleNavigation("analytics")}
              >
                <PieChart className="w-4 h-4 mr-2" />
                Analytics & Reports
              </Button>

              {/* Revenue Reconciliation */}
              {(adminAuthService.hasPermission(PERMISSIONS.FINANCE_REPORTS) ||
                adminAuthService.canAccessDepartment("Accounts")) && (
                <Button
                  variant={
                    activeSection === "reconciliation" ? "default" : "ghost"
                  }
                  className="w-full justify-start"
                  onClick={() => handleNavigation("reconciliation")}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Revenue Reconciliation
                </Button>
              )}

              {/* Voucher Templates */}
              <Button
                variant={activeSection === "vouchers" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleNavigation("vouchers")}
              >
                <Mail className="w-4 h-4 mr-2" />
                Voucher Templates
              </Button>

              {/* Audit Logs */}
              {adminAuthService.hasPermission(PERMISSIONS.SYSTEM_SETTINGS) && (
                <Button
                  variant={activeSection === "audit" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation("audit")}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Audit Logs
                </Button>
              )}

              {/* Content Management */}
              {adminAuthService.hasPermission(PERMISSIONS.CMS_VIEW) && (
                <Button
                  variant={activeSection === "cms" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation("cms")}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Content Management
                </Button>
              )}

              {/* AI Tools */}
              <Button
                variant={activeSection === "ai-tools" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleNavigation("ai-tools")}
              >
                <Zap className="w-4 h-4 mr-2" />
                AI Tools
              </Button>

              {/* System Settings */}
              {adminAuthService.hasPermission(PERMISSIONS.SYSTEM_SETTINGS) && (
                <Button
                  variant={activeSection === "settings" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation("settings")}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  System Settings
                </Button>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:ml-0">
          {activeSection === "overview" && (
            <div className="space-y-6">
              {/* Real-time Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Active Users
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {realtimeData.activeUsers}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Activity className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">+12%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Active Bargains
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {realtimeData.activeBargains}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Target className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                      <span className="text-sm text-blue-600">Live</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Today's Bookings
                        </p>
                        <p className="text-2xl font-bold text-purple-600">
                          {realtimeData.todayBookings}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-purple-500 mr-1" />
                      <span className="text-sm text-purple-600">+8%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Today's Revenue
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                          ₹{realtimeData.todayRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-orange-500 mr-1" />
                      <span className="text-sm text-orange-600">+15%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts and Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardStats.recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                activity.type === "booking"
                                  ? "bg-green-500"
                                  : activity.type === "bargain"
                                    ? "bg-blue-500"
                                    : "bg-purple-500"
                              }`}
                            ></div>
                            <div>
                              <p className="text-sm font-medium">
                                {activity.user}
                              </p>
                              <p className="text-xs text-gray-600">
                                {activity.action}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {activity.time}
                            </p>
                            {activity.amount && (
                              <p className="text-sm font-semibold text-green-600">
                                ₹{activity.amount}
                              </p>
                            )}
                            {activity.savings && (
                              <p className="text-sm font-semibold text-blue-600">
                                Saved ₹{activity.savings}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Destinations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardStats.topDestinations.map((dest, index) => (
                        <div
                          key={dest.name}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-blue-600">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{dest.name}</p>
                              <p className="text-xs text-gray-600">
                                {dest.bookings} bookings
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold">
                            ₹{dest.revenue.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                      className="h-20 flex-col text-xs sm:text-sm"
                      variant="outline"
                      onClick={() => handleNavigation("extranet")}
                    >
                      <Upload className="w-6 h-6 mb-2" />
                      Upload Inventory
                    </Button>
                    <Button
                      className="h-20 flex-col text-xs sm:text-sm"
                      variant="outline"
                      onClick={() => handleNavigation("promotions")}
                    >
                      <Tag className="w-6 h-6 mb-2" />
                      Create Promo
                    </Button>
                    <Button
                      className="h-20 flex-col text-xs sm:text-sm"
                      variant="outline"
                      onClick={() => handleNavigation("analytics")}
                    >
                      <Download className="w-6 h-6 mb-2" />
                      Export Report
                    </Button>
                    <Button
                      className="h-20 flex-col text-xs sm:text-sm"
                      variant="outline"
                      onClick={() => handleNavigation("bargain")}
                    >
                      <Settings className="w-6 h-6 mb-2" />
                      Bargain Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Supplier Management */}
          {activeSection === "suppliers" && <SupplierManagement />}

          {/* Analytics & Reports */}
          {activeSection === "analytics" && <ReportingSystem />}

          {/* User Management */}
          {activeSection === "users" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    User Management System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      User Management
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Comprehensive user management system coming soon
                    </p>
                    <div className="text-left max-w-md mx-auto space-y-2">
                      <p className="text-sm">
                        • User list with advanced filtering
                      </p>
                      <p className="text-sm">• User activity tracking</p>
                      <p className="text-sm">• Account status management</p>
                      <p className="text-sm">• Bulk actions and exports</p>
                      <p className="text-sm">• Role-based access control</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Booking Management */}
          {activeSection === "bookings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Booking Management System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Booking Management
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Complete booking lifecycle management
                    </p>
                    <div className="text-left max-w-md mx-auto space-y-2">
                      <p className="text-sm">• Real-time booking monitoring</p>
                      <p className="text-sm">• Booking status management</p>
                      <p className="text-sm">
                        • Cancellation & refund processing
                      </p>
                      <p className="text-sm">• Supplier booking integration</p>
                      <p className="text-sm">• Automated confirmation emails</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payment & Accounting */}
          {activeSection === "payments" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment & Accounting Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Payment Dashboard
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Access the comprehensive payment and accounting system
                    </p>
                    <Button
                      onClick={() => window.open("/admin/payments", "_blank")}
                      className="mt-4"
                    >
                      Open Payment Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Bargain Engine */}
          {activeSection === "bargain" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Bargain Engine Control Center
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Bargain Engine
                    </h3>
                    <p className="text-gray-600 mb-4">
                      AI-powered bargaining system management
                    </p>
                    <div className="text-left max-w-md mx-auto space-y-2">
                      <p className="text-sm">
                        • Real-time bargain session monitoring
                      </p>
                      <p className="text-sm">• AI strategy configuration</p>
                      <p className="text-sm">• Success rate analytics</p>
                      <p className="text-sm">• Manual intervention tools</p>
                      <p className="text-sm">• Bargain rule management</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settlement Reports */}
          {activeSection === "settlements" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Settlement Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Settlement Reports
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Comprehensive settlement and reconciliation reports
                    </p>
                    <div className="text-left max-w-md mx-auto space-y-2">
                      <p className="text-sm">• Daily settlement reports</p>
                      <p className="text-sm">
                        • Supplier payment reconciliation
                      </p>
                      <p className="text-sm">• Gateway settlement tracking</p>
                      <p className="text-sm">• Commission calculations</p>
                      <p className="text-sm">• Export to accounting systems</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Transaction Logs */}
          {activeSection === "transactions" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Transaction Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Transaction Monitoring
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Real-time transaction logging and monitoring
                    </p>
                    <div className="text-left max-w-md mx-auto space-y-2">
                      <p className="text-sm">
                        • Real-time transaction tracking
                      </p>
                      <p className="text-sm">• Payment gateway logs</p>
                      <p className="text-sm">• Failed transaction analysis</p>
                      <p className="text-sm">• Fraud detection alerts</p>
                      <p className="text-sm">• Audit trail maintenance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Revenue Reconciliation */}
          {activeSection === "reconciliation" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="w-5 h-5 mr-2" />
                    Revenue Reconciliation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Revenue Reconciliation
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Automated revenue reconciliation and reporting
                    </p>
                    <div className="text-left max-w-md mx-auto space-y-2">
                      <p className="text-sm">
                        • Automated reconciliation processes
                      </p>
                      <p className="text-sm">• Revenue vs booking matching</p>
                      <p className="text-sm">• Discrepancy identification</p>
                      <p className="text-sm">
                        • Financial reporting integration
                      </p>
                      <p className="text-sm">• Tax calculation and reporting</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Voucher Templates */}
          {activeSection === "vouchers" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Voucher Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Email & PDF Templates
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Customizable voucher and confirmation templates
                    </p>
                    <div className="text-left max-w-md mx-auto space-y-2">
                      <p className="text-sm">• Email confirmation templates</p>
                      <p className="text-sm">• PDF voucher generation</p>
                      <p className="text-sm">• Branded template design</p>
                      <p className="text-sm">• Multi-language support</p>
                      <p className="text-sm">• Template version control</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Audit Logs */}
          {activeSection === "audit" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Audit Logs & Activity Monitor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Security & Audit
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Comprehensive security and audit logging
                    </p>
                    <div className="text-left max-w-md mx-auto space-y-2">
                      <p className="text-sm">• User activity monitoring</p>
                      <p className="text-sm">• System access logs</p>
                      <p className="text-sm">• Data modification tracking</p>
                      <p className="text-sm">• Security incident reports</p>
                      <p className="text-sm">• Compliance reporting</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Other sections with placeholder content */}
          {[
            "inventory",
            "extranet",
            "pricing",
            "promotions",
            "cms",
            "ai-tools",
            "settings",
          ].includes(activeSection) && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    {activeSection.charAt(0).toUpperCase() +
                      activeSection.slice(1).replace("-", " ")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {activeSection.charAt(0).toUpperCase() +
                        activeSection.slice(1).replace("-", " ")}{" "}
                      Module
                    </h3>
                    <p className="text-gray-600 mb-4">
                      This module is ready for development and will include
                      comprehensive functionality.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
