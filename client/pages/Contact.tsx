import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  HelpCircle,
  Star,
  ArrowLeft,
} from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const Contact = () => {
  const navigate = useNavigate();

  const handleBackNavigation = () => {
    // For native app experience, always go back to main app (hotels by default)
    // This ensures consistent navigation behavior
    console.log("Back button clicked - navigating to /hotels");
    navigate("/hotels");
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "",
        message: "",
      });
    }, 3000);
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      details: "support@faredown.com",
      description: "Get help via email - usually respond within 24 hours",
      color: "bg-blue-500",
    },
    {
      icon: Phone,
      title: "Phone Support",
      details: "+971 4 123 4567",
      description: "Call us directly for immediate assistance",
      color: "bg-green-500",
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      details: "Available 24/7",
      description: "Chat with our support team in real-time",
      color: "bg-purple-500",
    },
    {
      icon: MapPin,
      title: "Office Location",
      details: "Dubai, UAE",
      description: "Visit our main office for in-person support",
      color: "bg-orange-500",
    },
  ];

  const faqs = [
    {
      question: "How can I modify or cancel my booking?",
      answer:
        "You can manage your booking through the 'My Trips' section in your account, or contact our support team for assistance.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept major credit cards (Visa, Mastercard, American Express), debit cards, and various digital payment methods.",
    },
    {
      question: "How do I get my booking confirmation?",
      answer:
        "Booking confirmations are sent immediately to your registered email address. Please check your spam folder if you don't see it.",
    },
    {
      question: "Can I get a refund for my booking?",
      answer:
        "Refund eligibility depends on the booking type, fare rules, and cancellation timing. Please refer to our refund policy or contact support.",
    },
  ];

  return (
    <Layout showSearch={false}>
      <div>
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-16 relative">
          {/* Mobile Back Button */}
          <button
            onClick={handleBackNavigation}
            className="absolute top-4 left-4 md:hidden flex items-center gap-2 text-white hover:text-blue-200 active:bg-white/20 transition-all z-10 px-3 py-2 rounded-lg touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to App</span>
          </button>

          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              We're here to help with all your travel needs
            </p>
            <div className="flex items-center justify-center gap-2 text-blue-100">
              <Clock className="w-5 h-5" />
              <span>24/7 Customer Support Available</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Send us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-green-600 mb-2">
                        Message Sent Successfully!
                      </h3>
                      <p className="text-gray-600">
                        We'll get back to you within 24 hours.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              handleInputChange("name", e.target.value)
                            }
                            placeholder="Enter your full name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                          </label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) =>
                              handleInputChange("category", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="booking">
                                Booking Inquiry
                              </SelectItem>
                              <SelectItem value="modification">
                                Booking Modification
                              </SelectItem>
                              <SelectItem value="cancellation">
                                Cancellation
                              </SelectItem>
                              <SelectItem value="refund">
                                Refund Request
                              </SelectItem>
                              <SelectItem value="technical">
                                Technical Support
                              </SelectItem>
                              <SelectItem value="feedback">Feedback</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subject *
                          </label>
                          <Input
                            type="text"
                            value={formData.subject}
                            onChange={(e) =>
                              handleInputChange("subject", e.target.value)
                            }
                            placeholder="Brief subject of your inquiry"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message *
                        </label>
                        <Textarea
                          value={formData.message}
                          onChange={(e) =>
                            handleInputChange("message", e.target.value)
                          }
                          placeholder="Please provide details about your inquiry..."
                          rows={6}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact Methods & Info */}
            <div className="space-y-6">
              {/* Contact Methods */}
              <div className="space-y-4">
                {contactMethods.map((method, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 ${method.color} rounded-lg flex items-center justify-center`}
                        >
                          <method.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {method.title}
                          </h3>
                          <p className="text-blue-600 font-medium">
                            {method.details}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {method.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Business Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Business Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday - Friday</span>
                    <span className="font-medium">9:00 AM - 10:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday</span>
                    <span className="font-medium">10:00 AM - 8:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday</span>
                    <span className="font-medium">10:00 AM - 6:00 PM</span>
                  </div>
                  <div className="border-t pt-2 mt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Emergency Support</span>
                      <span className="font-medium text-green-600">
                        24/7 Available
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t">
                  <p className="text-center text-gray-600">
                    Can't find what you're looking for?{" "}
                    <Link
                      to="/help-center"
                      className="text-blue-600 hover:underline"
                    >
                      Visit our Help Center
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
