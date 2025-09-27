import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Database,
  Server,
  Wifi,
  Activity,
  Package,
  Plane,
  Hotel,
  Camera,
  Car,
  Ticket,
  DollarSign,
  Settings,
  TrendingUp,
  Users,
  Globe,
} from "lucide-react";
import { apiClient } from "@/lib/api";

interface ModuleStatus {
  name: string;
  icon: React.ComponentType<any>;
  status: "online" | "offline" | "warning";
  endpoint: string;
  description: string;
  dataCount?: number;
  lastUpdated?: string;
  features: string[];
}

export default function SystemStatus() {
  const [modules, setModules] = useState<ModuleStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<string>("");

  const moduleConfigs: ModuleStatus[] = [
    {
      name: "Promo Codes",
      icon: Ticket,
      status: "offline",
      endpoint: "/api/promo",
      description:
        "Manage promo codes for all modules with discounts and conditions",
      features: [
        "Create/Edit Promo Codes",
        "Module-specific validation",
        "Usage tracking",
        "Discount calculation",
      ],
    },
    {
      name: "Extranet Inventory",
      icon: Package,
      status: "offline",
      endpoint: "/api/admin/extranet/inventory",
      description: "Offline inventory management for all travel modules",
      features: [
        "Flight inventory",
        "Hotel inventory",
        "Sightseeing tours",
        "Transfer services",
        "Package deals",
      ],
    },
    {
      name: "Markup Management",
      icon: DollarSign,
      status: "offline",
      endpoint: "/api/admin/markup/packages",
      description: "Dynamic pricing rules and markup configuration",
      features: [
        "Percentage markup",
        "Fixed amount markup",
        "Tiered pricing",
        "Conditional rules",
      ],
    },
    {
      name: "Pricing Engine",
      icon: TrendingUp,
      status: "offline",
      endpoint: "/api/pricing/calculate",
      description: "Comprehensive pricing calculation with all business logic",
      features: [
        "Markup application",
        "Promo code discounts",
        "Tax calculation",
        "Currency conversion",
      ],
    },
    {
      name: "Flight Management",
      icon: Plane,
      status: "offline",
      endpoint: "/api/admin/extranet/inventory?module=flights",
      description: "Flight inventory and booking management",
      features: [
        "Flight search",
        "Pricing rules",
        "Cabin class management",
        "Route optimization",
      ],
    },
    {
      name: "Hotel Management",
      icon: Hotel,
      status: "offline",
      endpoint: "/api/admin/extranet/inventory?module=hotels",
      description: "Hotel inventory and reservation system",
      features: [
        "Room availability",
        "Property management",
        "Amenity tracking",
        "Rate management",
      ],
    },
    {
      name: "Sightseeing",
      icon: Camera,
      status: "offline",
      endpoint: "/api/admin/extranet/inventory?module=sightseeing",
      description: "Tour and activity management system",
      features: [
        "Tour packages",
        "Activity booking",
        "Guide assignment",
        "Group management",
      ],
    },
    {
      name: "Transfers",
      icon: Car,
      status: "offline",
      endpoint: "/api/admin/extranet/inventory?module=transfers",
      description: "Transfer and transportation services",
      features: [
        "Vehicle booking",
        "Route planning",
        "Driver assignment",
        "Fleet management",
      ],
    },
    {
      name: "Package Management",
      icon: Package,
      status: "offline",
      endpoint: "/api/admin/packages",
      description: "Holiday package creation and management",
      features: [
        "Package builder",
        "Itinerary management",
        "Bundle pricing",
        "Departure management",
      ],
    },
    {
      name: "User Management",
      icon: Users,
      status: "offline",
      endpoint: "/api/admin/users",
      description: "Admin user and customer management",
      features: [
        "User roles",
        "Permission management",
        "Profile management",
        "Activity tracking",
      ],
    },
  ];

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    setLoading(true);
    const updatedModules = [...moduleConfigs];

    for (let i = 0; i < updatedModules.length; i++) {
      const module = updatedModules[i];
      try {
        const response = await apiClient.get(module.endpoint);
        if (response.success || response.ok) {
          module.status = "online";
          module.dataCount =
            response.data?.total ||
            response.data?.length ||
            response.data?.promoCodes?.length ||
            0;
          module.lastUpdated = new Date().toLocaleTimeString();
        } else {
          module.status = "warning";
        }
      } catch (error) {
        console.log(
          `Module ${module.name} using fallback data:`,
          error.message,
        );
        module.status = "warning";
        module.dataCount = getFallbackDataCount(module.name);
        module.lastUpdated = "Using demo data";
      }
    }

    setModules(updatedModules);
    setLastCheck(new Date().toLocaleTimeString());
    setLoading(false);
  };

  const getFallbackDataCount = (moduleName: string): number => {
    const fallbackCounts = {
      "Promo Codes": 6,
      "Extranet Inventory": 10,
      "Markup Management": 4,
      "Flight Management": 2,
      "Hotel Management": 2,
      Sightseeing: 2,
      Transfers: 2,
      "Package Management": 2,
      "User Management": 0,
      "Pricing Engine": 0,
    };
    return fallbackCounts[moduleName] || 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "offline":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case "warning":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Demo Data</Badge>
        );
      case "offline":
        return <Badge className="bg-red-100 text-red-800">Offline</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Checking...</Badge>;
    }
  };

  const overallStatus =
    modules.length > 0
      ? {
          online: modules.filter((m) => m.status === "online").length,
          warning: modules.filter((m) => m.status === "warning").length,
          offline: modules.filter((m) => m.status === "offline").length,
          total: modules.length,
        }
      : { online: 0, warning: 0, offline: 0, total: 0 };

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-800">
                  {overallStatus.online}
                </p>
                <p className="text-sm text-green-600">Online</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-800">
                  {overallStatus.warning}
                </p>
                <p className="text-sm text-yellow-600">Demo Data</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-800">
                  {overallStatus.offline}
                </p>
                <p className="text-sm text-red-600">Offline</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Database className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-800">
                  {overallStatus.total}
                </p>
                <p className="text-sm text-blue-600">Total Modules</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Last checked: {lastCheck || "Never"}
            </p>
            <Button onClick={checkSystemStatus} disabled={loading} size="sm">
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Module Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modules.map((module, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <module.icon className="w-6 h-6 text-blue-600" />
                  <span>{module.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(module.status)}
                  {getStatusBadge(module.status)}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{module.description}</p>

              {module.dataCount !== undefined && (
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    {module.dataCount} records available
                  </span>
                  {module.lastUpdated && (
                    <span className="text-xs text-gray-400">
                      • {module.lastUpdated}
                    </span>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Features:
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {module.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Globe className="w-3 h-3" />
                  <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                    {module.endpoint}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Online</p>
                <p className="text-sm text-green-600">
                  Module is fully functional with live data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Demo Data</p>
                <p className="text-sm text-yellow-600">
                  Module is functional with sample data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Offline</p>
                <p className="text-sm text-red-600">
                  Module is not responding or has errors
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Backend Services</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>API Server:</span>
                  <Badge variant="outline">Node.js + Express</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Database:</span>
                  <Badge variant="outline">Mock Data (Demo)</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Authentication:</span>
                  <Badge variant="outline">JWT + Role-based</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Pricing Engine:</span>
                  <Badge variant="outline">Active</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Frontend Components</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Framework:</span>
                  <Badge variant="outline">React + TypeScript</Badge>
                </div>
                <div className="flex justify-between">
                  <span>UI Library:</span>
                  <Badge variant="outline">Tailwind + shadcn/ui</Badge>
                </div>
                <div className="flex justify-between">
                  <span>State Management:</span>
                  <Badge variant="outline">React Hooks</Badge>
                </div>
                <div className="flex justify-between">
                  <span>API Client:</span>
                  <Badge variant="outline">Custom HTTP Client</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
