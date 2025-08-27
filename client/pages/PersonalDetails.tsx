import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  BookOpen,
  Award,
  CreditCard,
  Settings,
  Heart,
  LogOut,
  Edit,
  Shield,
  Users,
  Bell,
  Lock,
  ChevronDown,
} from "lucide-react";

export default function PersonalDetails() {
  const [displayName, setDisplayName] = useState("Display name *");

  return (
    <Layout showSearch={false}>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-600">
        <Link to="/account" className="hover:underline">
          My account
        </Link>
        <span className="mx-2">&gt;</span>
        <span>Personal details</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
          {/* Sidebar */}
          <div className="space-y-2 lg:order-1 order-2">
            <Link
              to="/account/personal"
              className="flex items-center space-x-3 p-3 bg-blue-50 text-blue-700 rounded-lg"
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Personal details</span>
            </Link>
            <Link
              to="/account/security"
              className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg"
            >
              <Shield className="w-5 h-5 text-gray-600" />
              <span>Security settings</span>
            </Link>
            <Link
              to="/account/travelers"
              className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg"
            >
              <Users className="w-5 h-5 text-gray-600" />
              <span>Other travelers</span>
            </Link>
            <Link
              to="/account/preferences"
              className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg"
            >
              <Settings className="w-5 h-5 text-gray-600" />
              <span>Customization preferences</span>
            </Link>
            <Link
              to="/account/payment"
              className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg"
            >
              <CreditCard className="w-5 h-5 text-gray-600" />
              <span>Payment methods</span>
            </Link>
            <Link
              to="/account/privacy"
              className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg"
            >
              <Lock className="w-5 h-5 text-gray-600" />
              <span>Privacy and data management</span>
            </Link>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 lg:order-2 order-1">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Personal details
                </h1>
                <p className="text-gray-600 text-sm md:text-base">
                  Update your info and find out how it's used.
                </p>
              </div>
              <div className="w-12 h-12 md:w-16 md:h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-lg md:text-2xl font-bold text-black">
                  Z
                </span>
              </div>
            </div>

            <div className="space-y-8">
              {/* Name */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Name
                  </label>
                </div>
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">Zubin A</span>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Display name
                  </label>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Display name *"
                  />
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Cancel
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Save
                    </Button>
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Email address
                  </label>
                </div>
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900">zubin@gmail.com</span>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        Verified
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    This is the email address you use to sign in. It's also
                    where we send your booking confirmations.
                  </p>
                </div>
              </div>

              {/* Phone Number */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Phone number
                  </label>
                </div>
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900">🇮🇳 +91 98048 13331</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Properties or attractions you book will use this number if
                    they need to contact you.
                  </p>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Date of birth
                  </label>
                </div>
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">05/04/1978</span>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>

              {/* Nationality */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Nationality
                  </label>
                </div>
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">India</span>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>

              {/* Gender */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Gender
                  </label>
                </div>
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">I'm a man</span>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Address
                  </label>
                </div>
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">India</span>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>

              {/* Passport Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Passport details
                  </label>
                </div>
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Not provided</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600"
                    >
                      Add passport
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </Layout>
  );
}
