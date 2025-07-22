/**
 * Promo Code & Bargain Engine Admin Management
 * Comprehensive interface for managing promo codes, discounts, and bargain settings
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Target,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  RefreshCw,
  Play,
  Pause,
  Stop,
  Zap,
  Globe,
  MapPin,
  Plane,
  Building,
  Percent,
  Tag,
  Clock,
  Award,
  Briefcase,
  Star,
  CreditCard,
} from "lucide-react";

// Types for promo codes
interface PromoCode {
  id: string;
  code: string;
  name: string;
  type: 'percent' | 'fixed';
  discountFrom: number;
  discountTo: number;
  applicableTo: 'flights' | 'hotels' | 'both';
  filters?: {
    fromCity?: string;
    toCity?: string;
    airlines?: string[];
    cabinClass?: string[];
    cities?: string[];
    hotels?: string[];
    roomCategories?: string[];
  };
  travelPeriod?: {
    from: string;
    to: string;
  };
  validity: {
    startDate: string;
    endDate: string;
  };
  marketingBudget: number;
  budgetUsed: number;
  status: 'active' | 'paused' | 'exhausted' | 'expired';
  usageCount: number;
  createdAt: string;
  createdBy: string;
}

interface BargainSession {
  id: string;
  userId: string;
  type: 'flight' | 'hotel';
  originalPrice: number;
  targetPrice: number;
  finalPrice?: number;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
  promoCode?: string;
  timestamp: string;
}

export default function PromoCodeManager() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [bargainSessions, setBargainSessions] = useState<BargainSession[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null);
  const [activeTab, setActiveTab] = useState('promo-codes');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Form state for creating/editing promo codes
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'percent' as 'percent' | 'fixed',
    discountFrom: 0,
    discountTo: 0,
    applicableTo: 'both' as 'flights' | 'hotels' | 'both',
    filters: {
      fromCity: '',
      toCity: '',
      airlines: [] as string[],
      cabinClass: [] as string[],
      cities: [] as string[],
      hotels: [] as string[],
      roomCategories: [] as string[],
    },
    travelPeriod: {
      from: '',
      to: '',
    },
    validity: {
      startDate: '',
      endDate: '',
    },
    marketingBudget: 0,
  });

  // Mock data
  useEffect(() => {
    setPromoCodes([
      {
        id: 'promo_001',
        code: 'FLYHIGH100',
        name: 'Fly High Discount',
        type: 'percent',
        discountFrom: 5,
        discountTo: 15,
        applicableTo: 'flights',
        filters: {
          fromCity: 'Mumbai',
          toCity: 'Dubai',
          airlines: ['Emirates', 'Air India'],
          cabinClass: ['Economy', 'Business']
        },
        travelPeriod: {
          from: '2025-02-01',
          to: '2025-12-31'
        },
        validity: {
          startDate: '2025-01-15',
          endDate: '2025-12-31'
        },
        marketingBudget: 100000,
        budgetUsed: 15750,
        status: 'active',
        usageCount: 157,
        createdAt: '2025-01-15T00:00:00Z',
        createdBy: 'admin'
      },
      {
        id: 'promo_002',
        code: 'HOTELFEST',
        name: 'Hotel Festival Offer',
        type: 'fixed',
        discountFrom: 2000,
        discountTo: 5000,
        applicableTo: 'hotels',
        filters: {
          cities: ['Dubai', 'Singapore'],
          hotels: ['Atlantis The Palm', 'Marina Bay Sands'],
          roomCategories: ['Deluxe', 'Suite', 'Presidential']
        },
        travelPeriod: {
          from: '2025-03-01',
          to: '2025-06-30'
        },
        validity: {
          startDate: '2025-01-20',
          endDate: '2025-06-30'
        },
        marketingBudget: 250000,
        budgetUsed: 87500,
        status: 'active',
        usageCount: 203,
        createdAt: '2025-01-20T00:00:00Z',
        createdBy: 'admin'
      },
      {
        id: 'promo_003',
        code: 'TRAVEL25',
        name: 'Universal Travel Discount',
        type: 'percent',
        discountFrom: 8,
        discountTo: 25,
        applicableTo: 'both',
        travelPeriod: {
          from: '2025-01-01',
          to: '2025-12-31'
        },
        validity: {
          startDate: '2025-01-01',
          endDate: '2025-12-31'
        },
        marketingBudget: 500000,
        budgetUsed: 125000,
        status: 'active',
        usageCount: 892,
        createdAt: '2025-01-01T00:00:00Z',
        createdBy: 'admin'
      }
    ]);

    setBargainSessions([
      {
        id: 'bargain_001',
        userId: 'user_123',
        type: 'flight',
        originalPrice: 45000,
        targetPrice: 38000,
        finalPrice: 41000,
        status: 'accepted',
        promoCode: 'FLYHIGH100',
        timestamp: '2025-01-21T14:30:00Z'
      },
      {
        id: 'bargain_002',
        userId: 'user_456',
        type: 'hotel',
        originalPrice: 12000,
        targetPrice: 9500,
        status: 'active',
        promoCode: 'HOTELFEST',
        timestamp: '2025-01-21T15:45:00Z'
      }
    ]);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'paused':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Pause className="w-3 h-3 mr-1" />
            Paused
          </Badge>
        );
      case 'exhausted':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Exhausted
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'percent' ? (
      <Badge variant="outline">
        <Percent className="w-3 h-3 mr-1" />
        Percentage
      </Badge>
    ) : (
      <Badge variant="outline">
        <DollarSign className="w-3 h-3 mr-1" />
        Fixed Amount
      </Badge>
    );
  };

  const getApplicableToBadge = (applicableTo: string) => {
    switch (applicableTo) {
      case 'flights':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Plane className="w-3 h-3 mr-1" />
            Flights
          </Badge>
        );
      case 'hotels':
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <Building className="w-3 h-3 mr-1" />
            Hotels
          </Badge>
        );
      case 'both':
        return (
          <Badge className="bg-indigo-100 text-indigo-800">
            <Globe className="w-3 h-3 mr-1" />
            Both
          </Badge>
        );
      default:
        return <Badge variant="outline">{applicableTo}</Badge>;
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'percent',
      discountFrom: 0,
      discountTo: 0,
      applicableTo: 'both',
      filters: {
        fromCity: '',
        toCity: '',
        airlines: [],
        cabinClass: [],
        cities: [],
        hotels: [],
        roomCategories: [],
      },
      travelPeriod: {
        from: '',
        to: '',
      },
      validity: {
        startDate: '',
        endDate: '',
      },
      marketingBudget: 0,
    });
  };

  const handleCreatePromo = () => {
    // Create new promo code logic here
    console.log('Creating promo:', formData);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEditPromo = () => {
    // Edit promo code logic here
    console.log('Editing promo:', formData);
    setIsEditDialogOpen(false);
    resetForm();
    setSelectedPromo(null);
  };

  const handleDeletePromo = (promoId: string) => {
    // Delete promo code logic here
    console.log('Deleting promo:', promoId);
    setPromoCodes(prev => prev.filter(p => p.id !== promoId));
  };

  const handleToggleStatus = (promoId: string) => {
    // Toggle promo status logic here
    setPromoCodes(prev => prev.map(p => 
      p.id === promoId 
        ? { ...p, status: p.status === 'active' ? 'paused' : 'active' }
        : p
    ));
  };

  const filteredPromoCodes = promoCodes.filter(promo => {
    const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promo.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || promo.status === statusFilter;
    const matchesType = typeFilter === 'all' || promo.applicableTo === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalBudget = promoCodes.reduce((sum, p) => sum + p.marketingBudget, 0);
  const totalUsed = promoCodes.reduce((sum, p) => sum + p.budgetUsed, 0);
  const totalUsage = promoCodes.reduce((sum, p) => sum + p.usageCount, 0);
  const activePromos = promoCodes.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promo Code & Bargain Engine</h1>
          <p className="text-gray-600">
            Manage promotional codes, discounts, and bargain settings for flights and hotels
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Promo Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Promo Code</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Promo Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="e.g., FLYHIGH100"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Fly High Discount"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Discount Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="type">Discount Type</Label>
                    <Select value={formData.type} onValueChange={(value: 'percent' | 'fixed') => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discountFrom">Discount From</Label>
                    <Input
                      id="discountFrom"
                      type="number"
                      value={formData.discountFrom}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountFrom: Number(e.target.value) }))}
                      placeholder={formData.type === 'percent' ? '5' : '1000'}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discountTo">Discount To</Label>
                    <Input
                      id="discountTo"
                      type="number"
                      value={formData.discountTo}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountTo: Number(e.target.value) }))}
                      placeholder={formData.type === 'percent' ? '15' : '5000'}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Applicable Services */}
                <div>
                  <Label htmlFor="applicableTo">Applicable To</Label>
                  <Select value={formData.applicableTo} onValueChange={(value: 'flights' | 'hotels' | 'both') => setFormData(prev => ({ ...prev, applicableTo: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flights">Flights Only</SelectItem>
                      <SelectItem value="hotels">Hotels Only</SelectItem>
                      <SelectItem value="both">Both Flights & Hotels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filters Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Filters & Restrictions</h3>
                  
                  {(formData.applicableTo === 'flights' || formData.applicableTo === 'both') && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-600 mb-3">Flight Filters</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>From City</Label>
                          <Input
                            value={formData.filters.fromCity}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              filters: { ...prev.filters, fromCity: e.target.value }
                            }))}
                            placeholder="e.g., Mumbai"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>To City</Label>
                          <Input
                            value={formData.filters.toCity}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              filters: { ...prev.filters, toCity: e.target.value }
                            }))}
                            placeholder="e.g., Dubai"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(formData.applicableTo === 'hotels' || formData.applicableTo === 'both') && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-purple-600 mb-3">Hotel Filters</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Cities</Label>
                          <Input
                            value={formData.filters.cities?.join(', ')}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              filters: { ...prev.filters, cities: e.target.value.split(',').map(s => s.trim()) }
                            }))}
                            placeholder="e.g., Dubai, Singapore"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Room Categories</Label>
                          <Input
                            value={formData.filters.roomCategories?.join(', ')}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              filters: { ...prev.filters, roomCategories: e.target.value.split(',').map(s => s.trim()) }
                            }))}
                            placeholder="e.g., Deluxe, Suite"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Date Configuration</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3">Validity Period</h4>
                      <div className="space-y-3">
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={formData.validity.startDate}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              validity: { ...prev.validity, startDate: e.target.value }
                            }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={formData.validity.endDate}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              validity: { ...prev.validity, endDate: e.target.value }
                            }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3">Travel Period</h4>
                      <div className="space-y-3">
                        <div>
                          <Label>Travel From</Label>
                          <Input
                            type="date"
                            value={formData.travelPeriod.from}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              travelPeriod: { ...prev.travelPeriod, from: e.target.value }
                            }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Travel To</Label>
                          <Input
                            type="date"
                            value={formData.travelPeriod.to}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              travelPeriod: { ...prev.travelPeriod, to: e.target.value }
                            }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Budget Configuration */}
                <div>
                  <Label htmlFor="marketingBudget">Marketing Budget (₹)</Label>
                  <Input
                    id="marketingBudget"
                    type="number"
                    value={formData.marketingBudget}
                    onChange={(e) => setFormData(prev => ({ ...prev, marketingBudget: Number(e.target.value) }))}
                    placeholder="100000"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Promo code will be automatically disabled when budget is exhausted
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePromo}>
                  Create Promo Code
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Promo Codes</p>
                <p className="text-2xl font-bold text-green-600">{activePromos}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+2 this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-blue-600">₹{totalBudget.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <Progress value={(totalUsed / totalBudget) * 100} className="w-16 mr-2" />
              <span className="text-sm text-blue-600">{((totalUsed / totalBudget) * 100).toFixed(1)}% used</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold text-purple-600">{totalUsage}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+45 today</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-600">15.2%</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+2.3% this month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="promo-codes">Promo Codes</TabsTrigger>
          <TabsTrigger value="bargain-sessions">Bargain Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Promo Codes Tab */}
        <TabsContent value="promo-codes" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search promo codes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="exhausted">Exhausted</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="flights">Flights</SelectItem>
                    <SelectItem value="hotels">Hotels</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Promo Codes Table */}
          <Card>
            <CardHeader>
              <CardTitle>Promo Codes ({filteredPromoCodes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code & Name</TableHead>
                      <TableHead>Type & Discount</TableHead>
                      <TableHead>Applicable To</TableHead>
                      <TableHead>Budget & Usage</TableHead>
                      <TableHead>Validity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPromoCodes.map((promo) => (
                      <TableRow key={promo.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{promo.code}</p>
                            <p className="text-sm text-gray-500">{promo.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getTypeBadge(promo.type)}
                            <p className="text-sm">
                              {promo.discountFrom}{promo.type === 'percent' ? '%' : '₹'} - {promo.discountTo}{promo.type === 'percent' ? '%' : '₹'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getApplicableToBadge(promo.applicableTo)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-sm">
                                <span>Budget:</span>
                                <span>₹{promo.marketingBudget.toLocaleString()}</span>
                              </div>
                              <Progress value={(promo.budgetUsed / promo.marketingBudget) * 100} className="mt-1" />
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Used: ₹{promo.budgetUsed.toLocaleString()}</span>
                                <span>{((promo.budgetUsed / promo.marketingBudget) * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                            <p className="text-sm">
                              <Users className="w-3 h-3 inline mr-1" />
                              {promo.usageCount} uses
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>Start: {new Date(promo.validity.startDate).toLocaleDateString()}</p>
                            <p>End: {new Date(promo.validity.endDate).toLocaleDateString()}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(promo.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setSelectedPromo(promo);
                              setIsEditDialogOpen(true);
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(promo.id)}>
                              {promo.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Copy className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{promo.code}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeletePromo(promo.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bargain Sessions Tab */}
        <TabsContent value="bargain-sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Bargain Sessions ({bargainSessions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Pricing</TableHead>
                      <TableHead>Promo Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bargainSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-mono text-sm">{session.id}</TableCell>
                        <TableCell>
                          {session.type === 'flight' ? (
                            <Badge className="bg-blue-100 text-blue-800">
                              <Plane className="w-3 h-3 mr-1" />
                              Flight
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-100 text-purple-800">
                              <Building className="w-3 h-3 mr-1" />
                              Hotel
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-gray-500">Original:</span> ₹{session.originalPrice.toLocaleString()}
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Target:</span> ₹{session.targetPrice.toLocaleString()}
                            </div>
                            {session.finalPrice && (
                              <div className="text-sm font-semibold text-green-600">
                                <span className="text-gray-500">Final:</span> ₹{session.finalPrice.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {session.promoCode ? (
                            <Badge variant="outline">{session.promoCode}</Badge>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(session.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(session.timestamp).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Promo Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {promoCodes
                    .sort((a, b) => b.usageCount - a.usageCount)
                    .slice(0, 5)
                    .map((promo, index) => (
                      <div key={promo.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{promo.code}</p>
                          <p className="text-sm text-gray-500">{promo.usageCount} uses</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">₹{promo.budgetUsed.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">
                            {((promo.budgetUsed / promo.marketingBudget) * 100).toFixed(1)}% of budget
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Flight Promos</span>
                      <span>67%</span>
                    </div>
                    <Progress value={67} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Hotel Promos</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Universal Promos</span>
                      <span>89%</span>
                    </div>
                    <Progress value={89} className="mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">₹2.8M</p>
                  <p className="text-sm text-gray-600">Total Savings</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">15.2%</p>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">₹4,580</p>
                  <p className="text-sm text-gray-600">Avg Discount</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">94.2%</p>
                  <p className="text-sm text-gray-600">User Satisfaction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
