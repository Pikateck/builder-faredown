/**
 * Comprehensive API Testing Dashboard
 * Postman-like interface for testing all system APIs
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Play,
  Save,
  Copy,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Globe,
  Lock,
  Key,
  Code,
  FileText,
  Activity,
  Zap,
  Database,
  Plane,
  Hotel,
  MapPin,
  Brain,
  CreditCard,
  Users,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface APIEndpoint {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  description: string;
  category: string;
  auth_required: boolean;
  headers?: { [key: string]: string };
  body_schema?: any;
  response_schema?: any;
  examples?: any[];
}

interface APICategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  endpoints: APIEndpoint[];
}

const API_CATEGORIES: APICategory[] = [
  {
    id: "auth",
    name: "Authentication",
    description: "User authentication and authorization",
    icon: Lock,
    color: "bg-red-500",
    endpoints: [
      {
        id: "auth_login",
        name: "User Login",
        method: "POST",
        url: "/api/auth/login",
        description: "Authenticate user and get access token",
        category: "auth",
        auth_required: false,
        body_schema: {
          email: "string",
          password: "string"
        },
        examples: [
          {
            name: "Standard Login",
            body: {
              email: "user@example.com",
              password: "password123"
            }
          }
        ]
      },
      {
        id: "auth_admin_login",
        name: "Admin Login",
        method: "POST",
        url: "/api/admin/login",
        description: "Admin authentication",
        category: "auth",
        auth_required: false,
        body_schema: {
          username: "string",
          password: "string"
        }
      },
      {
        id: "auth_refresh",
        name: "Refresh Token",
        method: "POST",
        url: "/api/auth/refresh",
        description: "Refresh access token",
        category: "auth",
        auth_required: true
      }
    ]
  },
  {
    id: "flights",
    name: "Flight APIs",
    description: "Flight search, booking, and management",
    icon: Plane,
    color: "bg-blue-500",
    endpoints: [
      {
        id: "flights_search",
        name: "Search Flights",
        method: "GET",
        url: "/api/flights/search",
        description: "Search for available flights",
        category: "flights",
        auth_required: false,
        examples: [
          {
            name: "Delhi to Mumbai",
            params: {
              origin: "DEL",
              destination: "BOM",
              departure: "2025-02-15",
              adults: 1,
              cabin: "ECONOMY"
            }
          }
        ]
      },
      {
        id: "flights_book",
        name: "Book Flight",
        method: "POST",
        url: "/api/flights/book",
        description: "Book a selected flight",
        category: "flights",
        auth_required: true,
        body_schema: {
          flight_id: "string",
          passengers: "array",
          payment_details: "object"
        }
      }
    ]
  },
  {
    id: "hotels",
    name: "Hotel APIs", 
    description: "Hotel search, booking, and management",
    icon: Hotel,
    color: "bg-green-500",
    endpoints: [
      {
        id: "hotels_search",
        name: "Search Hotels",
        method: "GET",
        url: "/api/hotels/search",
        description: "Search for available hotels",
        category: "hotels",
        auth_required: false,
        examples: [
          {
            name: "Dubai Hotels",
            params: {
              destination: "Dubai",
              checkin: "2025-02-15",
              checkout: "2025-02-18",
              adults: 2,
              rooms: 1
            }
          }
        ]
      },
      {
        id: "hotels_live",
        name: "Live Hotel Rates",
        method: "GET",
        url: "/api/hotels-live",
        description: "Get real-time hotel rates",
        category: "hotels",
        auth_required: false
      }
    ]
  },
  {
    id: "bargain",
    name: "Bargain Engine",
    description: "AI-powered bargaining system",
    icon: Brain,
    color: "bg-purple-500",
    endpoints: [
      {
        id: "bargain_start",
        name: "Start Bargain Session",
        method: "POST",
        url: "/api/bargain/v1/session/start",
        description: "Initialize a bargaining session",
        category: "bargain",
        auth_required: true,
        body_schema: {
          user: {
            id: "string",
            tier: "string"
          },
          productCPO: {
            type: "string",
            canonical_key: "string",
            displayed_price: "number",
            currency: "string"
          }
        },
        examples: [
          {
            name: "Hotel Bargain",
            body: {
              user: {
                id: "user_123",
                tier: "GOLD"
              },
              productCPO: {
                type: "hotel",
                canonical_key: "HT:12345:DXB:DELUXE",
                displayed_price: 250,
                currency: "USD"
              }
            }
          }
        ]
      },
      {
        id: "bargain_offer",
        name: "Make Offer",
        method: "POST",
        url: "/api/bargain/v1/offer",
        description: "Make a bargaining offer",
        category: "bargain",
        auth_required: true,
        body_schema: {
          session_id: "string",
          user_offer: "number"
        }
      }
    ]
  },
  {
    id: "ai_admin",
    name: "AI Admin APIs",
    description: "AI system management and monitoring",
    icon: Zap,
    color: "bg-yellow-500",
    endpoints: [
      {
        id: "ai_live",
        name: "Live AI Monitoring",
        method: "GET",
        url: "/api/admin/ai/live",
        description: "Get real-time AI system metrics",
        category: "ai_admin",
        auth_required: true
      },
      {
        id: "ai_policies",
        name: "Get AI Policies",
        method: "GET",
        url: "/api/admin/ai/policies",
        description: "Retrieve AI bargaining policies",
        category: "ai_admin",
        auth_required: true
      },
      {
        id: "ai_policy_validate",
        name: "Validate Policy",
        method: "POST",
        url: "/api/admin/ai/policies/validate",
        description: "Validate AI policy YAML",
        category: "ai_admin",
        auth_required: true,
        body_schema: {
          dsl_yaml: "string"
        }
      }
    ]
  },
  {
    id: "admin",
    name: "Admin APIs",
    description: "Administrative functions",
    icon: Settings,
    color: "bg-gray-500",
    endpoints: [
      {
        id: "admin_dashboard",
        name: "Dashboard Stats",
        method: "GET",
        url: "/api/admin-dashboard/stats",
        description: "Get admin dashboard statistics",
        category: "admin",
        auth_required: true
      },
      {
        id: "admin_users",
        name: "Manage Users",
        method: "GET",
        url: "/api/users",
        description: "Get user list",
        category: "admin",
        auth_required: true
      }
    ]
  },
  {
    id: "payments",
    name: "Payment APIs",
    description: "Payment processing and management",
    icon: CreditCard,
    color: "bg-emerald-500",
    endpoints: [
      {
        id: "payments_create",
        name: "Create Payment",
        method: "POST",
        url: "/api/payments/create",
        description: "Create a new payment",
        category: "payments",
        auth_required: true,
        body_schema: {
          amount: "number",
          currency: "string",
          booking_id: "string"
        }
      }
    ]
  },
  {
    id: "system",
    name: "System APIs",
    description: "System health and utilities",
    icon: Activity,
    color: "bg-indigo-500",
    endpoints: [
      {
        id: "system_health",
        name: "Health Check",
        method: "GET",
        url: "/health",
        description: "System health status",
        category: "system",
        auth_required: false
      },
      {
        id: "system_metrics",
        name: "System Metrics",
        method: "GET",
        url: "/metrics",
        description: "Prometheus metrics",
        category: "system",
        auth_required: false
      }
    ]
  }
];

const APITestingDashboard: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState("testing");
  const [selectedCategory, setSelectedCategory] = useState("auth");
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [requestUrl, setRequestUrl] = useState("");
  const [requestMethod, setRequestMethod] = useState<string>("GET");
  const [requestHeaders, setRequestHeaders] = useState("{}");
  const [requestBody, setRequestBody] = useState("");
  const [requestParams, setRequestParams] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [savedRequests, setSavedRequests] = useState<any[]>([]);

  useEffect(() => {
    // Load saved auth token
    const savedToken = localStorage.getItem("api_test_token");
    if (savedToken) {
      setAuthToken(savedToken);
    }

    // Load saved requests
    const saved = localStorage.getItem("api_test_requests");
    if (saved) {
      setSavedRequests(JSON.parse(saved));
    }
  }, []);

  const selectEndpoint = (endpoint: APIEndpoint) => {
    setSelectedEndpoint(endpoint);
    setRequestUrl(endpoint.url);
    setRequestMethod(endpoint.method);
    
    // Set default headers
    const headers: any = {
      "Content-Type": "application/json"
    };
    
    if (endpoint.auth_required && authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    
    setRequestHeaders(JSON.stringify(headers, null, 2));
    
    // Set example body if available
    if (endpoint.examples && endpoint.examples.length > 0) {
      const example = endpoint.examples[0];
      if (example.body) {
        setRequestBody(JSON.stringify(example.body, null, 2));
      }
      if (example.params) {
        setRequestParams(new URLSearchParams(example.params).toString());
      }
    } else {
      setRequestBody(endpoint.body_schema ? JSON.stringify(endpoint.body_schema, null, 2) : "");
    }
  };

  const executeRequest = async () => {
    if (!requestUrl) return;
    
    setLoading(true);
    setResponse(null);
    
    try {
      let url = requestUrl;
      if (requestParams && requestMethod === "GET") {
        url += `?${requestParams}`;
      }
      
      const headers = JSON.parse(requestHeaders || "{}");
      
      const config: RequestInit = {
        method: requestMethod,
        headers: headers,
      };
      
      if (requestMethod !== "GET" && requestBody) {
        config.body = requestBody;
      }
      
      const startTime = Date.now();
      const response = await fetch(url, config);
      const endTime = Date.now();
      
      const responseData = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: null,
        time: endTime - startTime
      };
      
      try {
        responseData.data = await response.json();
      } catch {
        responseData.data = await response.text();
      }
      
      setResponse(responseData);
    } catch (error: any) {
      setResponse({
        status: 0,
        statusText: "Network Error",
        headers: {},
        data: { error: error.message },
        time: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAuthToken = () => {
    localStorage.setItem("api_test_token", authToken);
  };

  const saveRequest = () => {
    const request = {
      id: Date.now().toString(),
      name: selectedEndpoint?.name || "Custom Request",
      method: requestMethod,
      url: requestUrl,
      headers: requestHeaders,
      body: requestBody,
      params: requestParams,
      timestamp: new Date().toISOString()
    };
    
    const updated = [...savedRequests, request];
    setSavedRequests(updated);
    localStorage.setItem("api_test_requests", JSON.stringify(updated));
  };

  const loadSavedRequest = (request: any) => {
    setRequestUrl(request.url);
    setRequestMethod(request.method);
    setRequestHeaders(request.headers);
    setRequestBody(request.body);
    setRequestParams(request.params);
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-600";
    if (status >= 400 && status < 500) return "text-yellow-600";
    if (status >= 500) return "text-red-600";
    return "text-gray-600";
  };

  const currentCategory = API_CATEGORIES.find(cat => cat.id === selectedCategory);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Testing Dashboard</h1>
          <p className="text-gray-600">Comprehensive API testing interface for all system endpoints</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50">
            <TestTube className="w-4 h-4 mr-1" />
            {API_CATEGORIES.reduce((sum, cat) => sum + cat.endpoints.length, 0)} Endpoints
          </Badge>
        </div>
      </div>

      <Tabs value="testing" className="space-y-6">
        <TabsList>
          <TabsTrigger value="testing">API Testing</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="saved">Saved Requests</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
        </TabsList>

        {/* API Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* API Categories Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    API Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {API_CATEGORIES.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <category.icon className="w-4 h-4 mr-2" />
                      <span className="flex-1 text-left">{category.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {category.endpoints.length}
                      </Badge>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Endpoints List */}
              {currentCategory && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <currentCategory.icon className="w-5 h-5 mr-2" />
                      {currentCategory.name}
                    </CardTitle>
                    <CardDescription>{currentCategory.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {currentCategory.endpoints.map((endpoint) => (
                      <div
                        key={endpoint.id}
                        className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                          selectedEndpoint?.id === endpoint.id ? "bg-blue-50 border-blue-200" : ""
                        }`}
                        onClick={() => selectEndpoint(endpoint)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={endpoint.method === "GET" ? "default" : 
                                     endpoint.method === "POST" ? "destructive" :
                                     endpoint.method === "PUT" ? "secondary" : "outline"}
                              className="text-xs"
                            >
                              {endpoint.method}
                            </Badge>
                            {endpoint.auth_required && (
                              <Lock className="w-3 h-3 text-gray-500" />
                            )}
                          </div>
                        </div>
                        <div className="mt-1">
                          <div className="font-medium text-sm">{endpoint.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{endpoint.url}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Request Builder */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Play className="w-5 h-5 mr-2" />
                    Request Builder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* URL and Method */}
                  <div className="flex space-x-2">
                    <Select value={requestMethod} onValueChange={setRequestMethod}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="https://api.example.com/endpoint"
                      value={requestUrl}
                      onChange={(e) => setRequestUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={executeRequest} disabled={loading}>
                      {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      {loading ? "Sending..." : "Send"}
                    </Button>
                  </div>

                  {/* Request Tabs */}
                  <Tabs defaultValue="headers" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="headers">Headers</TabsTrigger>
                      <TabsTrigger value="body">Body</TabsTrigger>
                      <TabsTrigger value="params">Params</TabsTrigger>
                    </TabsList>

                    <TabsContent value="headers">
                      <div className="space-y-2">
                        <Label>Request Headers (JSON)</Label>
                        <Textarea
                          placeholder='{"Content-Type": "application/json"}'
                          value={requestHeaders}
                          onChange={(e) => setRequestHeaders(e.target.value)}
                          rows={4}
                          className="font-mono text-sm"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="body">
                      <div className="space-y-2">
                        <Label>Request Body (JSON)</Label>
                        <Textarea
                          placeholder='{"key": "value"}'
                          value={requestBody}
                          onChange={(e) => setRequestBody(e.target.value)}
                          rows={8}
                          className="font-mono text-sm"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="params">
                      <div className="space-y-2">
                        <Label>Query Parameters</Label>
                        <Input
                          placeholder="param1=value1&param2=value2"
                          value={requestParams}
                          onChange={(e) => setRequestParams(e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={saveRequest}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Request
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Response */}
              {response && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Activity className="w-5 h-5 mr-2" />
                        Response
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(response.status)}>
                          {response.status} {response.statusText}
                        </Badge>
                        <Badge variant="outline">
                          {response.time}ms
                        </Badge>
                        <Button variant="outline" size="sm" onClick={copyResponse}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="body">
                      <TabsList>
                        <TabsTrigger value="body">Response Body</TabsTrigger>
                        <TabsTrigger value="headers">Response Headers</TabsTrigger>
                      </TabsList>

                      <TabsContent value="body">
                        <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                          {JSON.stringify(response.data, null, 2)}
                        </pre>
                      </TabsContent>

                      <TabsContent value="headers">
                        <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                          {JSON.stringify(response.headers, null, 2)}
                        </pre>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="documentation">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {API_CATEGORIES.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <category.icon className="w-5 h-5 mr-2" />
                    {category.name}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.endpoints.map((endpoint) => (
                      <Collapsible key={endpoint.id}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {endpoint.method}
                            </Badge>
                            <span className="font-medium">{endpoint.name}</span>
                            {endpoint.auth_required && (
                              <Lock className="w-3 h-3 text-gray-500" />
                            )}
                          </div>
                          <ChevronDown className="w-4 h-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-2 py-2">
                          <div className="space-y-2 text-sm">
                            <div className="font-mono text-xs bg-gray-100 p-2 rounded">
                              {endpoint.url}
                            </div>
                            <p className="text-gray-600">{endpoint.description}</p>
                            {endpoint.examples && endpoint.examples.length > 0 && (
                              <div>
                                <strong>Example:</strong>
                                <pre className="bg-gray-50 p-2 rounded text-xs mt-1">
                                  {JSON.stringify(endpoint.examples[0], null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Authentication Tab */}
        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Authentication Management
              </CardTitle>
              <CardDescription>
                Manage authentication tokens for API testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Bearer Token</Label>
                <div className="flex space-x-2">
                  <Input
                    type={showAuthToken ? "text" : "password"}
                    placeholder="Enter your JWT token here"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowAuthToken(!showAuthToken)}
                  >
                    {showAuthToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button onClick={saveAuthToken}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your token will be automatically included in requests to endpoints that require authentication.
                  To get a token, use the login endpoints in the Authentication category.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Authentication</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      For customer-facing APIs like bookings and user data.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => selectEndpoint(API_CATEGORIES[0].endpoints[0])}
                    >
                      Try User Login
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Admin Authentication</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      For admin APIs like AI management and system controls.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => selectEndpoint(API_CATEGORIES[0].endpoints[1])}
                    >
                      Try Admin Login
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Saved Requests Tab */}
        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Saved Requests
              </CardTitle>
              <CardDescription>
                Your saved API requests for quick access
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No saved requests yet</p>
                  <p className="text-sm">Save requests from the API Testing tab</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => loadSavedRequest(request)}
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          {request.method}
                        </Badge>
                        <div>
                          <div className="font-medium">{request.name}</div>
                          <div className="text-sm text-gray-500 font-mono">{request.url}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(request.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default APITestingDashboard;
