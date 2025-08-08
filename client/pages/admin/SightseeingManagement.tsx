import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Calendar,
  Clock,
  MapPin,
  Star,
  Users,
  Camera,
  Building2,
  Ticket,
  Mountain,
  Utensils,
  Music,
  Edit3,
  Trash2,
  Plus,
  Filter,
  Search,
  Download,
  Upload,
  Eye,
  Settings,
  TrendingUp,
  DollarSign,
  Activity,
  Tag
} from "lucide-react";

interface SightseeingItem {
  id: string;
  activity_code: string;
  activity_name: string;
  activity_description: string;
  category: string;
  destination_name: string;
  duration_text: string;
  base_price: number;
  currency: string;
  rating: number;
  review_count: number;
  is_active: boolean;
  is_featured: boolean;
  main_image_url: string;
  created_at: string;
}

interface SightseeingBooking {
  id: string;
  booking_ref: string;
  activity_name: string;
  destination_name: string;
  visit_date: string;
  visit_time: string;
  adults_count: number;
  total_amount: number;
  status: string;
  guest_name: string;
  guest_email: string;
  booking_date: string;
}

interface MarkupRule {
  id: string;
  rule_name: string;
  rule_type: string;
  destination_code: string;
  category: string;
  markup_type: string;
  markup_value: number;
  is_active: boolean;
}

interface PromoCode {
  id: string;
  code: string;
  title: string;
  discount_type: string;
  discount_value: number;
  usage_count: number;
  usage_limit: number;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
}

export default function SightseeingManagement() {
  const [activities, setActivities] = useState<SightseeingItem[]>([]);
  const [bookings, setBookings] = useState<SightseeingBooking[]>([]);
  const [markupRules, setMarkupRules] = useState<MarkupRule[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Form states
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showAddMarkup, setShowAddMarkup] = useState(false);
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [newActivity, setNewActivity] = useState({
    activity_code: "",
    activity_name: "",
    activity_description: "",
    category: "",
    destination_name: "",
    duration_text: "",
    base_price: 0,
    main_image_url: "",
    is_active: true,
    is_featured: false
  });

  const [newMarkupRule, setNewMarkupRule] = useState({
    rule_name: "",
    rule_type: "destination",
    destination_code: "",
    category: "",
    markup_type: "percentage",
    markup_value: 15,
    is_active: true
  });

  const [newPromoCode, setNewPromoCode] = useState({
    code: "",
    title: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    maximum_discount: 500,
    minimum_booking_amount: 100,
    usage_limit: 100,
    valid_from: "",
    valid_to: "",
    is_active: true
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load sample data (in production, these would be API calls)
      setActivities([
        {
          id: "1",
          activity_code: "burj-khalifa",
          activity_name: "Burj Khalifa: Floors 124 and 125",
          activity_description: "Skip the line and enjoy breathtaking views from the world's tallest building",
          category: "landmark",
          destination_name: "Dubai",
          duration_text: "1-2 hours",
          base_price: 149,
          currency: "INR",
          rating: 4.6,
          review_count: 45879,
          is_active: true,
          is_featured: true,
          main_image_url: "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2Fadc752b547864028b3c403d353c64fe5?format=webp&width=800",
          created_at: "2025-01-15T10:00:00Z"
        },
        {
          id: "2",
          activity_code: "dubai-aquarium",
          activity_name: "Dubai Aquarium & Underwater Zoo",
          activity_description: "Explore one of the world's largest suspended aquariums",
          category: "museum",
          destination_name: "Dubai",
          duration_text: "2-3 hours",
          base_price: 89,
          currency: "INR",
          rating: 4.4,
          review_count: 23156,
          is_active: true,
          is_featured: false,
          main_image_url: "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2Fb08adc2a1406489eb370c69caa7f37ee?format=webp&width=800",
          created_at: "2025-01-15T10:00:00Z"
        }
      ]);

      setBookings([
        {
          id: "1",
          booking_ref: "SG12345678",
          activity_name: "Burj Khalifa: Floors 124 and 125",
          destination_name: "Dubai",
          visit_date: "2025-08-16",
          visit_time: "14:30",
          adults_count: 2,
          total_amount: 298,
          status: "confirmed",
          guest_name: "John Doe",
          guest_email: "john@example.com",
          booking_date: "2025-01-15T10:00:00Z"
        }
      ]);

      setMarkupRules([
        {
          id: "1",
          rule_name: "Dubai Premium Markup",
          rule_type: "destination",
          destination_code: "Dubai",
          category: "",
          markup_type: "percentage",
          markup_value: 18,
          is_active: true
        }
      ]);

      setPromoCodes([
        {
          id: "1",
          code: "SIGHTSEEING10",
          title: "10% Off Sightseeing",
          discount_type: "percentage",
          discount_value: 10,
          usage_count: 25,
          usage_limit: 100,
          valid_from: "2025-01-01",
          valid_to: "2025-12-31",
          is_active: true
        }
      ]);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "landmark": return <Building2 className="w-4 h-4" />;
      case "museum": return <Camera className="w-4 h-4" />;
      case "tour": return <Ticket className="w-4 h-4" />;
      case "adventure": return <Mountain className="w-4 h-4" />;
      case "food": return <Utensils className="w-4 h-4" />;
      case "culture": return <Music className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      confirmed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800"
    };
    return <Badge className={colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const handleAddActivity = () => {
    // In production, this would make an API call
    const activity: SightseeingItem = {
      id: (activities.length + 1).toString(),
      ...newActivity,
      rating: 4.5,
      review_count: 0,
      currency: "INR",
      created_at: new Date().toISOString()
    };
    setActivities([...activities, activity]);
    setNewActivity({
      activity_code: "",
      activity_name: "",
      activity_description: "",
      category: "",
      destination_name: "",
      duration_text: "",
      base_price: 0,
      main_image_url: "",
      is_active: true,
      is_featured: false
    });
    setShowAddActivity(false);
  };

  const handleAddMarkupRule = () => {
    const rule: MarkupRule = {
      id: (markupRules.length + 1).toString(),
      ...newMarkupRule
    };
    setMarkupRules([...markupRules, rule]);
    setNewMarkupRule({
      rule_name: "",
      rule_type: "destination",
      destination_code: "",
      category: "",
      markup_type: "percentage",
      markup_value: 15,
      is_active: true
    });
    setShowAddMarkup(false);
  };

  const handleAddPromoCode = () => {
    const promo: PromoCode = {
      id: (promoCodes.length + 1).toString(),
      usage_count: 0,
      usage_limit: newPromoCode.usage_limit,
      ...newPromoCode
    };
    setPromoCodes([...promoCodes, promo]);
    setNewPromoCode({
      code: "",
      title: "",
      description: "",
      discount_type: "percentage",
      discount_value: 10,
      maximum_discount: 500,
      minimum_booking_amount: 100,
      usage_limit: 100,
      valid_from: "",
      valid_to: "",
      is_active: true
    });
    setShowAddPromo(false);
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.destination_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || activity.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sightseeing Management</h1>
          <p className="text-gray-600">Manage activities, bookings, markup rules, and promotions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import Activities
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹45,231</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promos</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promoCodes.filter(p => p.is_active).length}</div>
            <p className="text-xs text-muted-foreground">2 expiring soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="activities" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="markup">Markup Rules</TabsTrigger>
          <TabsTrigger value="promos">Promo Codes</TabsTrigger>
        </TabsList>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="landmark">Landmarks</SelectItem>
                  <SelectItem value="museum">Museums</SelectItem>
                  <SelectItem value="tour">Tours</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="food">Food & Dining</SelectItem>
                  <SelectItem value="culture">Culture</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={showAddActivity} onOpenChange={setShowAddActivity}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Activity</DialogTitle>
                  <DialogDescription>Create a new sightseeing activity</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="activity_code">Activity Code</Label>
                    <Input
                      id="activity_code"
                      value={newActivity.activity_code}
                      onChange={(e) => setNewActivity({...newActivity, activity_code: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newActivity.category} onValueChange={(value) => setNewActivity({...newActivity, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landmark">Landmarks</SelectItem>
                        <SelectItem value="museum">Museums</SelectItem>
                        <SelectItem value="tour">Tours</SelectItem>
                        <SelectItem value="adventure">Adventure</SelectItem>
                        <SelectItem value="food">Food & Dining</SelectItem>
                        <SelectItem value="culture">Culture</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="activity_name">Activity Name</Label>
                    <Input
                      id="activity_name"
                      value={newActivity.activity_name}
                      onChange={(e) => setNewActivity({...newActivity, activity_name: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newActivity.activity_description}
                      onChange={(e) => setNewActivity({...newActivity, activity_description: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination">Destination</Label>
                    <Input
                      id="destination"
                      value={newActivity.destination_name}
                      onChange={(e) => setNewActivity({...newActivity, destination_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      value={newActivity.duration_text}
                      onChange={(e) => setNewActivity({...newActivity, duration_text: e.target.value})}
                      placeholder="e.g., 2-3 hours"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Base Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newActivity.base_price}
                      onChange={(e) => setNewActivity({...newActivity, base_price: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image_url">Main Image URL</Label>
                    <Input
                      id="image_url"
                      value={newActivity.main_image_url}
                      onChange={(e) => setNewActivity({...newActivity, main_image_url: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newActivity.is_featured}
                      onCheckedChange={(checked) => setNewActivity({...newActivity, is_featured: checked})}
                    />
                    <Label>Featured Activity</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newActivity.is_active}
                      onCheckedChange={(checked) => setNewActivity({...newActivity, is_active: checked})}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddActivity(false)}>Cancel</Button>
                  <Button onClick={handleAddActivity}>Create Activity</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img
                          src={activity.main_image_url}
                          alt={activity.activity_name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-medium">{activity.activity_name}</div>
                          <div className="text-sm text-gray-500">{activity.activity_code}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(activity.category)}
                        <span className="capitalize">{activity.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>{activity.destination_name}</TableCell>
                    <TableCell>{activity.duration_text}</TableCell>
                    <TableCell>₹{activity.base_price}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span>{activity.rating}</span>
                        <span className="text-gray-500">({activity.review_count})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {activity.is_featured && <Badge variant="secondary">Featured</Badge>}
                        <Badge className={activity.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {activity.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this activity? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Manage sightseeing bookings and customer information</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking Ref</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Visit Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.booking_ref}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.activity_name}</div>
                          <div className="text-sm text-gray-500">{booking.destination_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.guest_name}</div>
                          <div className="text-sm text-gray-500">{booking.guest_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{booking.visit_date}</div>
                          <div className="text-sm text-gray-500">{booking.visit_time}</div>
                        </div>
                      </TableCell>
                      <TableCell>₹{booking.total_amount}</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Markup Rules Tab */}
        <TabsContent value="markup" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Markup Rules</h3>
              <p className="text-gray-600">Configure pricing markup rules for different destinations and categories</p>
            </div>
            <Dialog open={showAddMarkup} onOpenChange={setShowAddMarkup}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Markup Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Markup Rule</DialogTitle>
                  <DialogDescription>Create a new pricing markup rule</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rule_name">Rule Name</Label>
                    <Input
                      id="rule_name"
                      value={newMarkupRule.rule_name}
                      onChange={(e) => setNewMarkupRule({...newMarkupRule, rule_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rule_type">Rule Type</Label>
                    <Select value={newMarkupRule.rule_type} onValueChange={(value) => setNewMarkupRule({...newMarkupRule, rule_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="destination">Destination</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                        <SelectItem value="global">Global</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newMarkupRule.rule_type === "destination" && (
                    <div>
                      <Label htmlFor="destination_code">Destination</Label>
                      <Input
                        id="destination_code"
                        value={newMarkupRule.destination_code}
                        onChange={(e) => setNewMarkupRule({...newMarkupRule, destination_code: e.target.value})}
                      />
                    </div>
                  )}
                  {newMarkupRule.rule_type === "category" && (
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={newMarkupRule.category} onValueChange={(value) => setNewMarkupRule({...newMarkupRule, category: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="landmark">Landmarks</SelectItem>
                          <SelectItem value="museum">Museums</SelectItem>
                          <SelectItem value="tour">Tours</SelectItem>
                          <SelectItem value="adventure">Adventure</SelectItem>
                          <SelectItem value="food">Food & Dining</SelectItem>
                          <SelectItem value="culture">Culture</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="markup_type">Markup Type</Label>
                    <Select value={newMarkupRule.markup_type} onValueChange={(value) => setNewMarkupRule({...newMarkupRule, markup_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="markup_value">
                      Markup Value {newMarkupRule.markup_type === "percentage" ? "(%)" : "(₹)"}
                    </Label>
                    <Input
                      id="markup_value"
                      type="number"
                      value={newMarkupRule.markup_value}
                      onChange={(e) => setNewMarkupRule({...newMarkupRule, markup_value: Number(e.target.value)})}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newMarkupRule.is_active}
                      onCheckedChange={(checked) => setNewMarkupRule({...newMarkupRule, is_active: checked})}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddMarkup(false)}>Cancel</Button>
                  <Button onClick={handleAddMarkupRule}>Create Rule</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Markup</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {markupRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.rule_name}</TableCell>
                    <TableCell className="capitalize">{rule.rule_type}</TableCell>
                    <TableCell>{rule.destination_code || rule.category || "All"}</TableCell>
                    <TableCell>
                      {rule.markup_value}{rule.markup_type === "percentage" ? "%" : " ₹"}
                    </TableCell>
                    <TableCell>
                      <Badge className={rule.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Promo Codes Tab */}
        <TabsContent value="promos" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Promotional Codes</h3>
              <p className="text-gray-600">Manage discount codes and promotional offers</p>
            </div>
            <Dialog open={showAddPromo} onOpenChange={setShowAddPromo}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Promo Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Promotional Code</DialogTitle>
                  <DialogDescription>Create a new discount code for sightseeing bookings</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Promo Code</Label>
                    <Input
                      id="code"
                      value={newPromoCode.code}
                      onChange={(e) => setNewPromoCode({...newPromoCode, code: e.target.value.toUpperCase()})}
                      placeholder="e.g., SUMMER20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newPromoCode.title}
                      onChange={(e) => setNewPromoCode({...newPromoCode, title: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newPromoCode.description}
                      onChange={(e) => setNewPromoCode({...newPromoCode, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount_type">Discount Type</Label>
                    <Select value={newPromoCode.discount_type} onValueChange={(value) => setNewPromoCode({...newPromoCode, discount_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discount_value">
                      Discount Value {newPromoCode.discount_type === "percentage" ? "(%)" : "(₹)"}
                    </Label>
                    <Input
                      id="discount_value"
                      type="number"
                      value={newPromoCode.discount_value}
                      onChange={(e) => setNewPromoCode({...newPromoCode, discount_value: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="usage_limit">Usage Limit</Label>
                    <Input
                      id="usage_limit"
                      type="number"
                      value={newPromoCode.usage_limit}
                      onChange={(e) => setNewPromoCode({...newPromoCode, usage_limit: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimum_amount">Minimum Booking Amount (₹)</Label>
                    <Input
                      id="minimum_amount"
                      type="number"
                      value={newPromoCode.minimum_booking_amount}
                      onChange={(e) => setNewPromoCode({...newPromoCode, minimum_booking_amount: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="valid_from">Valid From</Label>
                    <Input
                      id="valid_from"
                      type="date"
                      value={newPromoCode.valid_from}
                      onChange={(e) => setNewPromoCode({...newPromoCode, valid_from: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="valid_to">Valid To</Label>
                    <Input
                      id="valid_to"
                      type="date"
                      value={newPromoCode.valid_to}
                      onChange={(e) => setNewPromoCode({...newPromoCode, valid_to: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newPromoCode.is_active}
                      onCheckedChange={(checked) => setNewPromoCode({...newPromoCode, is_active: checked})}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddPromo(false)}>Cancel</Button>
                  <Button onClick={handleAddPromoCode}>Create Promo Code</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-mono font-medium">{promo.code}</TableCell>
                    <TableCell>{promo.title}</TableCell>
                    <TableCell>
                      {promo.discount_value}{promo.discount_type === "percentage" ? "%" : " ₹"}
                    </TableCell>
                    <TableCell>
                      {promo.usage_count} / {promo.usage_limit || "∞"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{promo.valid_from}</div>
                        <div className="text-gray-500">to {promo.valid_to}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={promo.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {promo.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
