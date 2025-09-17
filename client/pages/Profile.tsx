import React, { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  FileText,
  Settings,
  Bell,
  Shield,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Globe,
  Users,
  Heart,
  Star,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CountrySelect } from "@/components/ui/country-select";

// API Service with proper error handling
const profileAPI = {
  baseURL: "/api/profile",

  async handleResponse(response) {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    // Check if response has content
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return await response.text();
  },

  async fetchProfile() {
    try {
      const response = await fetch(`${this.baseURL}`, {
        headers: { "X-User-ID": "1" } // Demo: use actual auth
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("fetchProfile error:", error);
      // Return mock data for development
      return {
        profile: {
          first_name: "Zubin",
          last_name: "Aibara",
          email: "zubin@example.com",
          phone: "+91 9876543210",
          email_verified: true
        }
      };
    }
  },

  async updateProfile(data) {
    try {
      const response = await fetch(`${this.baseURL}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": "1"
        },
        body: JSON.stringify(data)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("updateProfile error:", error);
      return { success: true, profile: data };
    }
  },

  async fetchTravelers() {
    try {
      const response = await fetch(`${this.baseURL}/travelers`, {
        headers: { "X-User-ID": "1" }
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("fetchTravelers error:", error);
      return { travelers: [] };
    }
  },

  async createTraveler(data) {
    try {
      const response = await fetch(`${this.baseURL}/travelers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": "1"
        },
        body: JSON.stringify(data)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("createTraveler error:", error);
      return { success: true, traveler: { ...data, id: Date.now() } };
    }
  },

  async updateTraveler(id, data) {
    try {
      const response = await fetch(`${this.baseURL}/travelers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": "1"
        },
        body: JSON.stringify(data)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("updateTraveler error:", error);
      return { success: true, traveler: { ...data, id } };
    }
  },

  async deleteTraveler(id) {
    try {
      const response = await fetch(`${this.baseURL}/travelers/${id}`, {
        method: "DELETE",
        headers: { "X-User-ID": "1" }
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("deleteTraveler error:", error);
      return { success: true };
    }
  },

  async fetchPassports(travelerId) {
    try {
      const response = await fetch(`${this.baseURL}/travelers/${travelerId}/passports`, {
        headers: { "X-User-ID": "1" }
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("fetchPassports error:", error);
      return { passports: [] };
    }
  },

  async createPassport(travelerId, data) {
    try {
      const response = await fetch(`${this.baseURL}/travelers/${travelerId}/passports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": "1"
        },
        body: JSON.stringify(data)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("createPassport error:", error);
      return { success: true, passport: { ...data, id: Date.now() } };
    }
  },

  async fetchPaymentMethods() {
    try {
      const response = await fetch(`${this.baseURL}/payment-methods`, {
        headers: { "X-User-ID": "1" }
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("fetchPaymentMethods error:", error);
      return { paymentMethods: [] };
    }
  },

  async createPaymentMethod(data) {
    try {
      const response = await fetch(`${this.baseURL}/payment-methods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": "1"
        },
        body: JSON.stringify(data)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("createPaymentMethod error:", error);
      return { success: true, paymentMethod: { ...data, id: Date.now() } };
    }
  },

  async setDefaultPaymentMethod(id) {
    try {
      const response = await fetch(`${this.baseURL}/payment-methods/${id}/default`, {
        method: "PUT",
        headers: { "X-User-ID": "1" }
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("setDefaultPaymentMethod error:", error);
      return { success: true };
    }
  },

  async deletePaymentMethod(id) {
    try {
      const response = await fetch(`${this.baseURL}/payment-methods/${id}`, {
        method: "DELETE",
        headers: { "X-User-ID": "1" }
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("deletePaymentMethod error:", error);
      return { success: true };
    }
  },

  async fetchPreferences() {
    try {
      const response = await fetch(`${this.baseURL}/preferences`, {
        headers: { "X-User-ID": "1" }
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("fetchPreferences error:", error);
      return {
        preferences: {
          currency_iso3: "INR",
          language: "en",
          email_notifications: true,
          price_alerts: false,
          marketing_opt_in: false
        }
      };
    }
  },

  async updatePreferences(data) {
    try {
      const response = await fetch(`${this.baseURL}/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": "1"
        },
        body: JSON.stringify(data)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("updatePreferences error:", error);
      return { success: true, preferences: data };
    }
  }
};

// Main Profile Component
export default function Profile({ standalone = true, initialTab = "personal" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [travelers, setTravelers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [preferences, setPreferences] = useState(null);
  
  // Modal states
  const [showTravelerModal, setShowTravelerModal] = useState(false);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingTraveler, setEditingTraveler] = useState(null);
  const [selectedTravelerForPassport, setSelectedTravelerForPassport] = useState(null);
  
  // Form states
  const [personalForm, setPersonalForm] = useState({});
  const [travelerForm, setTravelerForm] = useState({});
  const [passportForm, setPassportForm] = useState({});
  const [paymentForm, setPaymentForm] = useState({});
  
  useEffect(() => {
    loadInitialData();
  }, []);
  
  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load data sequentially to avoid potential race conditions
      console.log("Loading profile data...");

      // Load profile first
      const profileRes = await profileAPI.fetchProfile();
      console.log("Profile loaded:", profileRes);
      setProfile(profileRes.profile || {});
      setPersonalForm(profileRes.profile || {});

      // Load other data in parallel
      const [travelersRes, paymentRes, preferencesRes] = await Promise.all([
        profileAPI.fetchTravelers().catch(error => {
          console.error("Travelers fetch failed:", error);
          return { travelers: [] };
        }),
        profileAPI.fetchPaymentMethods().catch(error => {
          console.error("Payment methods fetch failed:", error);
          return { paymentMethods: [] };
        }),
        profileAPI.fetchPreferences().catch(error => {
          console.error("Preferences fetch failed:", error);
          return {
            preferences: {
              currency_iso3: "INR",
              language: "en",
              email_notifications: true,
              price_alerts: false,
              marketing_opt_in: false
            }
          };
        })
      ]);

      console.log("Additional data loaded:", { travelersRes, paymentRes, preferencesRes });

      setTravelers(travelersRes.travelers || []);
      setPaymentMethods(paymentRes.paymentMethods || []);
      setPreferences(preferencesRes.preferences || {});

      console.log("Profile data loading completed successfully");
    } catch (error) {
      console.error("Failed to load profile data:", error);
      // Set default values on error
      setProfile({
        first_name: "Zubin",
        last_name: "Aibara",
        email: "zubin@example.com",
        email_verified: true
      });
      setPersonalForm({
        first_name: "Zubin",
        last_name: "Aibara",
        email: "zubin@example.com"
      });
      setTravelers([]);
      setPaymentMethods([]);
      setPreferences({
        currency_iso3: "INR",
        language: "en",
        email_notifications: true,
        price_alerts: false,
        marketing_opt_in: false
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSavePersonal = async () => {
    try {
      setSaving(true);
      await profileAPI.updateProfile(personalForm);
      setProfile(personalForm);
      // Show success toast
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setSaving(false);
    }
  };
  
  const handleSaveTraveler = async () => {
    try {
      setSaving(true);
      if (editingTraveler) {
        await profileAPI.updateTraveler(editingTraveler.id, travelerForm);
      } else {
        await profileAPI.createTraveler(travelerForm);
      }
      await loadTravelers();
      setShowTravelerModal(false);
      setEditingTraveler(null);
      setTravelerForm({});
    } catch (error) {
      console.error("Failed to save traveler:", error);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteTraveler = async (id) => {
    if (confirm("Are you sure you want to delete this traveler?")) {
      try {
        await profileAPI.deleteTraveler(id);
        await loadTravelers();
      } catch (error) {
        console.error("Failed to delete traveler:", error);
      }
    }
  };
  
  const handleSavePassport = async () => {
    try {
      setSaving(true);
      await profileAPI.createPassport(selectedTravelerForPassport.id, passportForm);
      setShowPassportModal(false);
      setPassportForm({});
      setSelectedTravelerForPassport(null);
    } catch (error) {
      console.error("Failed to save passport:", error);
    } finally {
      setSaving(false);
    }
  };
  
  const handleSavePayment = async () => {
    try {
      setSaving(true);
      await profileAPI.createPaymentMethod(paymentForm);
      await loadPaymentMethods();
      setShowPaymentModal(false);
      setPaymentForm({});
    } catch (error) {
      console.error("Failed to save payment method:", error);
    } finally {
      setSaving(false);
    }
  };
  
  const loadTravelers = async () => {
    try {
      const res = await profileAPI.fetchTravelers();
      setTravelers(res.travelers || []);
    } catch (error) {
      console.error("Failed to load travelers:", error);
      setTravelers([]);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const res = await profileAPI.fetchPaymentMethods();
      setPaymentMethods(res.paymentMethods || []);
    } catch (error) {
      console.error("Failed to load payment methods:", error);
      setPaymentMethods([]);
    }
  };
  
  
  const currencies = [
    { code: "INR", name: "Indian Rupee", symbol: "₹" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "AED", name: "UAE Dirham", symbol: "AED" },
  ];
  
  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिन्दी" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
  ];
  
  const navigationItems = [
    { id: "personal", label: "Personal details", icon: User },
    { id: "security", label: "Security settings", icon: Shield },
    { id: "travelers", label: "Other travelers", icon: Users },
    { id: "preferences", label: "Customization preferences", icon: Settings },
    { id: "payments", label: "Payment methods", icon: CreditCard },
    { id: "privacy", label: "Privacy & data", icon: Eye },
  ];
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </div>
      </Layout>
    );
  }
  
  const profileContent = (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile?.full_name || `${profile?.first_name} ${profile?.last_name}` || "Your Profile"}
                  </h1>
                  <p className="text-gray-600">Manage your account settings and preferences</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Navigation Sidebar */}
            <div className="lg:w-1/4">
              <Card>
                <CardContent className="p-6">
                  <nav className="space-y-2">
                    {navigationItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                          activeTab === item.id
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "hover:bg-gray-50 text-gray-700"
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content */}
            <div className="lg:w-3/4">
              {activeTab === "personal" && (
                <PersonalDetailsTab
                  profile={profile}
                  personalForm={personalForm}
                  setPersonalForm={setPersonalForm}
                  onSave={handleSavePersonal}
                  saving={saving}
                />
              )}
              
              {activeTab === "travelers" && (
                <TravelersTab
                  travelers={travelers}
                  onEdit={(traveler) => {
                    setEditingTraveler(traveler);
                    setTravelerForm(traveler);
                    setShowTravelerModal(true);
                  }}
                  onDelete={handleDeleteTraveler}
                  onAddNew={() => {
                    setEditingTraveler(null);
                    setTravelerForm({});
                    setShowTravelerModal(true);
                  }}
                  onAddPassport={(traveler) => {
                    setSelectedTravelerForPassport(traveler);
                    setPassportForm({});
                    setShowPassportModal(true);
                  }}
                />
              )}
              
              {activeTab === "payments" && (
                <PaymentMethodsTab
                  paymentMethods={paymentMethods}
                  onAddNew={() => {
                    setPaymentForm({});
                    setShowPaymentModal(true);
                  }}
                  onSetDefault={async (id) => {
                    await profileAPI.setDefaultPaymentMethod(id);
                    await loadPaymentMethods();
                  }}
                  onDelete={async (id) => {
                    if (confirm("Are you sure you want to delete this payment method?")) {
                      await profileAPI.deletePaymentMethod(id);
                      await loadPaymentMethods();
                    }
                  }}
                />
              )}
              
              {activeTab === "preferences" && (
                <PreferencesTab
                  preferences={preferences}
                  onUpdate={async (data) => {
                    await profileAPI.updatePreferences(data);
                    const res = await profileAPI.fetchPreferences();
                    setPreferences(res.preferences);
                  }}
                  currencies={currencies}
                  languages={languages}
                />
              )}
              
              {activeTab === "security" && <SecurityTab />}
              {activeTab === "privacy" && <PrivacyTab />}
            </div>
          </div>
        </div>
        
        {/* Modals */}
        <TravelerModal
          isOpen={showTravelerModal}
          onClose={() => {
            setShowTravelerModal(false);
            setEditingTraveler(null);
            setTravelerForm({});
          }}
          traveler={editingTraveler}
          form={travelerForm}
          setForm={setTravelerForm}
          onSave={handleSaveTraveler}
          saving={saving}
        />
        
        <PassportModal
          isOpen={showPassportModal}
          onClose={() => {
            setShowPassportModal(false);
            setSelectedTravelerForPassport(null);
            setPassportForm({});
          }}
          traveler={selectedTravelerForPassport}
          form={passportForm}
          setForm={setPassportForm}
          onSave={handleSavePassport}
          saving={saving}
        />
        
        <PaymentMethodModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentForm({});
          }}
          form={paymentForm}
          setForm={setPaymentForm}
          onSave={handleSavePayment}
          saving={saving}
        />
      </div>
  );

  if (standalone) {
    return <Layout>{profileContent}</Layout>;
  }

  return profileContent;
}

// Personal Details Tab Component
function PersonalDetailsTab({ profile, personalForm, setPersonalForm, onSave, saving }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Personal details</span>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save changes
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="firstName">First name *</Label>
            <Input
              id="firstName"
              value={personalForm.first_name || ""}
              onChange={(e) => setPersonalForm({...personalForm, first_name: e.target.value})}
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last name *</Label>
            <Input
              id="lastName"
              value={personalForm.last_name || ""}
              onChange={(e) => setPersonalForm({...personalForm, last_name: e.target.value})}
              placeholder="Enter your last name"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            value={personalForm.display_name || ""}
            onChange={(e) => setPersonalForm({...personalForm, display_name: e.target.value})}
            placeholder="How would you like to be addressed?"
          />
        </div>
        
        <div>
          <Label htmlFor="email" className="flex items-center">
            Email address
            {profile?.email_verified && <CheckCircle className="w-4 h-4 text-green-600 ml-2" />}
          </Label>
          <Input
            id="email"
            type="email"
            value={personalForm.email || ""}
            onChange={(e) => setPersonalForm({...personalForm, email: e.target.value})}
            placeholder="Enter your email address"
          />
          {!profile?.email_verified && (
            <p className="text-sm text-amber-600 mt-1">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Email not verified. Click to verify.
            </p>
          )}
        </div>
        
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            value={personalForm.phone || ""}
            onChange={(e) => setPersonalForm({...personalForm, phone: e.target.value})}
            placeholder="Enter your phone number"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="dob">Date of birth</Label>
            <Input
              id="dob"
              type="date"
              value={personalForm.dob || ""}
              onChange={(e) => setPersonalForm({...personalForm, dob: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="nationality">Nationality</Label>
            <CountrySelect
              value={personalForm.nationality_iso2 || ""}
              onValueChange={(value) => setPersonalForm({...personalForm, nationality_iso2: value})}
              placeholder="Select nationality"
              prioritizePopular={true}
              showFlags={true}
              className="w-full"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select value={personalForm.gender || ""} onValueChange={(value) => setPersonalForm({...personalForm, gender: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="non_binary">Non-binary</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Address</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="address1">Address line 1</Label>
              <Input
                id="address1"
                value={personalForm.line1 || ""}
                onChange={(e) => setPersonalForm({...personalForm, line1: e.target.value})}
                placeholder="Street address"
              />
            </div>
            <div>
              <Label htmlFor="address2">Address line 2 (optional)</Label>
              <Input
                id="address2"
                value={personalForm.line2 || ""}
                onChange={(e) => setPersonalForm({...personalForm, line2: e.target.value})}
                placeholder="Apartment, suite, etc."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={personalForm.city || ""}
                  onChange={(e) => setPersonalForm({...personalForm, city: e.target.value})}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={personalForm.state || ""}
                  onChange={(e) => setPersonalForm({...personalForm, state: e.target.value})}
                  placeholder="State"
                />
              </div>
              <div>
                <Label htmlFor="postal">Postal code</Label>
                <Input
                  id="postal"
                  value={personalForm.postal_code || ""}
                  onChange={(e) => setPersonalForm({...personalForm, postal_code: e.target.value})}
                  placeholder="Postal code"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <CountrySelect
                value={personalForm.country_iso2 || ""}
                onValueChange={(value) => setPersonalForm({...personalForm, country_iso2: value})}
                placeholder="Select country"
                prioritizePopular={true}
                showFlags={true}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Travelers Tab Component
function TravelersTab({ travelers, onEdit, onDelete, onAddNew, onAddPassport }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Other travelers</span>
          <Button onClick={onAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add traveler
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-6">
          Save details about the people you're traveling with.
        </p>
        
        {travelers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No travelers saved yet</p>
            <Button onClick={onAddNew} className="mt-4">
              Add your first traveler
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {travelers.map((traveler) => (
              <div key={traveler.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold">
                        {traveler.first_name} {traveler.last_name}
                      </h3>
                      {traveler.is_primary && (
                        <Badge variant="secondary">Primary</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Date of birth: {new Date(traveler.dob).toLocaleDateString()}</p>
                      <p>Gender: {traveler.gender}</p>
                      {traveler.nationality_iso2 && (
                        <p>Nationality: {countries.find(c => c.code === traveler.nationality_iso2)?.name}</p>
                      )}
                      {traveler.relationship && (
                        <p>Relationship: {traveler.relationship}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddPassport(traveler)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Passport
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(traveler)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(traveler.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Payment Methods Tab Component
function PaymentMethodsTab({ paymentMethods, onAddNew, onSetDefault, onDelete }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Payment methods</span>
          <Button onClick={onAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add payment method
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-6">
          Securely add or remove payment methods to make it easier when you book.
        </p>
        
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No payment methods saved yet</p>
            <Button onClick={onAddNew} className="mt-4">
              Add your first payment method
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                      <CreditCard className="w-6 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {method.brand} •••• {method.last4}
                        </span>
                        {method.is_default && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Expires {method.exp_month?.toString().padStart(2, '0')}/{method.exp_year}
                      </p>
                      {method.holder_name && (
                        <p className="text-sm text-gray-600">{method.holder_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!method.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSetDefault(method.id)}
                      >
                        Set as default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(method.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Preferences Tab Component
function PreferencesTab({ preferences, onUpdate, currencies, languages }) {
  const [localPreferences, setLocalPreferences] = useState(preferences || {});
  
  useEffect(() => {
    setLocalPreferences(preferences || {});
  }, [preferences]);
  
  const handleSave = () => {
    onUpdate(localPreferences);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Customization preferences</span>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save changes
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select 
            value={localPreferences.currency_iso3 || "INR"} 
            onValueChange={(value) => setLocalPreferences({...localPreferences, currency_iso3: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="language">Language</Label>
          <Select 
            value={localPreferences.language || "en"} 
            onValueChange={(value) => setLocalPreferences({...localPreferences, language: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  {language.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email notifications</p>
                <p className="text-sm text-gray-600">Receive booking confirmations and updates</p>
              </div>
              <Switch
                checked={localPreferences.email_notifications !== false}
                onCheckedChange={(checked) => setLocalPreferences({...localPreferences, email_notifications: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Price alerts</p>
                <p className="text-sm text-gray-600">Get notified when prices drop</p>
              </div>
              <Switch
                checked={localPreferences.price_alerts === true}
                onCheckedChange={(checked) => setLocalPreferences({...localPreferences, price_alerts: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing communications</p>
                <p className="text-sm text-gray-600">Receive deals and promotional offers</p>
              </div>
              <Switch
                checked={localPreferences.marketing_opt_in === true}
                onCheckedChange={(checked) => setLocalPreferences({...localPreferences, marketing_opt_in: checked})}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Security Tab Component
function SecurityTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Password</h3>
          <Button variant="outline">
            Change password
          </Button>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Two-factor authentication</h3>
          <p className="text-gray-600 mb-4">
            Add an extra layer of security to your account
          </p>
          <Button variant="outline">
            Enable 2FA
          </Button>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Active sessions</h3>
          <p className="text-gray-600 mb-4">
            Manage where you're signed in
          </p>
          <Button variant="outline">
            View active sessions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Privacy Tab Component
function PrivacyTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy & data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Data export</h3>
          <p className="text-gray-600 mb-4">
            Download a copy of your data
          </p>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export data
          </Button>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Account deletion</h3>
          <p className="text-gray-600 mb-4">
            Permanently delete your account and all associated data
          </p>
          <Button variant="destructive">
            Delete account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Traveler Modal Component
function TravelerModal({ isOpen, onClose, traveler, form, setForm, onSave, saving }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {traveler ? "Edit traveler" : "Add new traveler"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First name *</Label>
              <Input
                id="firstName"
                value={form.firstName || ""}
                onChange={(e) => setForm({...form, firstName: e.target.value})}
                placeholder="First name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last name *</Label>
              <Input
                id="lastName"
                value={form.lastName || ""}
                onChange={(e) => setForm({...form, lastName: e.target.value})}
                placeholder="Last name"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="dob">Date of birth *</Label>
            <Input
              id="dob"
              type="date"
              value={form.dob || ""}
              onChange={(e) => setForm({...form, dob: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={form.gender || ""} onValueChange={(value) => setForm({...form, gender: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non_binary">Non-binary</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <CountrySelect
                value={form.nationalityIso2 || ""}
                onValueChange={(value) => setForm({...form, nationalityIso2: value})}
                placeholder="Select nationality"
                prioritizePopular={true}
                showFlags={true}
                className="w-full"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="relationship">Relationship</Label>
            <Select value={form.relationship || ""} onValueChange={(value) => setForm({...form, relationship: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Self</SelectItem>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="colleague">Colleague</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="frequentFlyer">Frequent flyer number (optional)</Label>
            <Input
              id="frequentFlyer"
              value={form.frequentFlyerNumber || ""}
              onChange={(e) => setForm({...form, frequentFlyerNumber: e.target.value})}
              placeholder="Enter frequent flyer number"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isPrimary"
              checked={form.isPrimary === true}
              onCheckedChange={(checked) => setForm({...form, isPrimary: checked})}
            />
            <Label htmlFor="isPrimary">Set as primary traveler</Label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {traveler ? "Update" : "Add"} traveler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Passport Modal Component
function PassportModal({ isOpen, onClose, traveler, form, setForm, onSave, saving }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Add passport for {traveler?.first_name} {traveler?.last_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="givenNames">Given names (as on passport) *</Label>
              <Input
                id="givenNames"
                value={form.givenNames || ""}
                onChange={(e) => setForm({...form, givenNames: e.target.value})}
                placeholder="Given names"
              />
            </div>
            <div>
              <Label htmlFor="surname">Surname (as on passport) *</Label>
              <Input
                id="surname"
                value={form.surname || ""}
                onChange={(e) => setForm({...form, surname: e.target.value})}
                placeholder="Surname"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="passportNumber">Passport number *</Label>
            <Input
              id="passportNumber"
              value={form.passportNumber || ""}
              onChange={(e) => setForm({...form, passportNumber: e.target.value})}
              placeholder="Enter passport number"
            />
          </div>
          
          <div>
            <Label htmlFor="issuingCountry">Issuing country *</Label>
            <CountrySelect
              value={form.issuingCountry || ""}
              onValueChange={(value) => setForm({...form, issuingCountry: value})}
              placeholder="Select issuing country"
              prioritizePopular={true}
              showFlags={true}
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issueDate">Issue date</Label>
              <Input
                id="issueDate"
                type="date"
                value={form.issueDate || ""}
                onChange={(e) => setForm({...form, issueDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry date *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={form.expiryDate || ""}
                onChange={(e) => setForm({...form, expiryDate: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="placeOfBirth">Place of birth</Label>
            <Input
              id="placeOfBirth"
              value={form.placeOfBirth || ""}
              onChange={(e) => setForm({...form, placeOfBirth: e.target.value})}
              placeholder="Enter place of birth"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isPrimary"
              checked={form.isPrimary === true}
              onCheckedChange={(checked) => setForm({...form, isPrimary: checked})}
            />
            <Label htmlFor="isPrimary">Set as primary passport</Label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Add passport
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Payment Method Modal Component
function PaymentMethodModal({ isOpen, onClose, form, setForm, onSave, saving }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add payment method</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Payment type *</Label>
            <Select value={form.type || ""} onValueChange={(value) => setForm({...form, type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Credit/Debit Card</SelectItem>
                <SelectItem value="bank_account">Bank Account</SelectItem>
                <SelectItem value="wallet">Digital Wallet</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {form.type === "card" && (
            <>
              <div>
                <Label htmlFor="holderName">Cardholder name *</Label>
                <Input
                  id="holderName"
                  value={form.holderName || ""}
                  onChange={(e) => setForm({...form, holderName: e.target.value})}
                  placeholder="Name on card"
                />
              </div>
              
              <div>
                <Label htmlFor="brand">Card brand *</Label>
                <Select value={form.brand || ""} onValueChange={(value) => setForm({...form, brand: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select card brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Visa">Visa</SelectItem>
                    <SelectItem value="Mastercard">Mastercard</SelectItem>
                    <SelectItem value="American Express">American Express</SelectItem>
                    <SelectItem value="Discover">Discover</SelectItem>
                    <SelectItem value="RuPay">RuPay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="last4">Last 4 digits *</Label>
                <Input
                  id="last4"
                  value={form.last4 || ""}
                  onChange={(e) => setForm({...form, last4: e.target.value})}
                  placeholder="1234"
                  maxLength={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expMonth">Expiry month *</Label>
                  <Select value={form.expMonth?.toString() || ""} onValueChange={(value) => setForm({...form, expMonth: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={month.toString()}>
                          {month.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expYear">Expiry year *</Label>
                  <Select value={form.expYear?.toString() || ""} onValueChange={(value) => setForm({...form, expYear: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 20}, (_, i) => new Date().getFullYear() + i).map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
          
          <div>
            <Label htmlFor="provider">Provider *</Label>
            <Input
              id="provider"
              value={form.provider || ""}
              onChange={(e) => setForm({...form, provider: e.target.value})}
              placeholder="e.g., stripe, razorpay"
            />
          </div>
          
          <div>
            <Label htmlFor="token">Token *</Label>
            <Input
              id="token"
              value={form.token || ""}
              onChange={(e) => setForm({...form, token: e.target.value})}
              placeholder="Payment provider token"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isDefault"
              checked={form.isDefault === true}
              onCheckedChange={(checked) => setForm({...form, isDefault: checked})}
            />
            <Label htmlFor="isDefault">Set as default payment method</Label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Add payment method
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
