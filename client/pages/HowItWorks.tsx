import React, { useState } from "react";
import { Layout } from "../components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Search,
  Brain,
  MessageSquare,
  CreditCard,
  CheckCircle,
  ArrowRight,
  Users,
  Globe,
  Shield,
  Zap,
  Target,
  TrendingUp,
  Sparkles,
  Clock,
  Award,
  Plane,
  Hotel,
  Car,
} from "lucide-react";

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 1,
      title: "Search & Select",
      description:
        "Browse flights, hotels, and travel services just like any other platform. Our intuitive interface makes finding your perfect trip easy.",
      icon: Search,
      color: "bg-blue-500",
      details: [
        "Search across 500+ airlines and hotels",
        "Compare prices from multiple sources",
        "Filter by preferences and budget",
        "View detailed information and reviews",
      ],
    },
    {
      id: 2,
      title: "AI Analyzes & Negotiates",
      description:
        "Our advanced AI bargaining engine works behind the scenes to negotiate better deals, upgrades, and exclusive perks on your behalf.",
      icon: Brain,
      color: "bg-purple-500",
      details: [
        "AI analyzes real-time market prices",
        "Negotiates with suppliers automatically",
        "Identifies upgrade opportunities",
        "Secures exclusive deals and perks",
      ],
    },
    {
      id: 3,
      title: "Get Better Deals",
      description:
        "Receive enhanced offers with potential upgrades, better seats, additional perks, or lower prices than standard booking platforms.",
      icon: TrendingUp,
      color: "bg-green-500",
      details: [
        "Premium seat upgrades",
        "Complimentary services",
        "Price reductions",
        "Exclusive amenities",
      ],
    },
    {
      id: 4,
      title: "Book with Confidence",
      description:
        "Complete your booking with our secure payment system and enjoy your enhanced travel experience with peace of mind.",
      icon: Shield,
      color: "bg-orange-500",
      details: [
        "Secure payment processing",
        "Instant confirmation",
        "24/7 customer support",
        "Booking protection guarantee",
      ],
    },
  ];

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Negotiation",
      description:
        "Our machine learning algorithms analyze millions of data points to negotiate the best possible deals.",
      benefits: [
        "Real-time price optimization",
        "Market trend analysis",
        "Automated bargaining",
      ],
    },
    {
      icon: Zap,
      title: "Instant Results",
      description:
        "Get enhanced offers within seconds of your search, no waiting around for manual negotiations.",
      benefits: [
        "Sub-second processing",
        "Real-time availability",
        "Immediate confirmation",
      ],
    },
    {
      icon: Shield,
      title: "Secure & Trusted",
      description:
        "Bank-level security ensures your data and payments are always protected throughout the process.",
      benefits: ["256-bit encryption", "PCI DSS compliant", "Fraud protection"],
    },
    {
      icon: Target,
      title: "Personalized Deals",
      description:
        "The more you use Faredown, the better our AI becomes at finding deals tailored to your preferences.",
      benefits: [
        "Learning algorithms",
        "Preference tracking",
        "Custom recommendations",
      ],
    },
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "Average 25% Savings",
      description:
        "Our users save an average of 25% compared to traditional booking platforms.",
      stat: "25%",
    },
    {
      icon: Award,
      title: "Premium Upgrades",
      description:
        "85% of our users receive some form of upgrade or additional perk.",
      stat: "85%",
    },
    {
      icon: Clock,
      title: "Time Savings",
      description: "No need to manually compare prices across multiple sites.",
      stat: "2 hours",
    },
    {
      icon: Users,
      title: "Customer Satisfaction",
      description:
        "Our customers rate their experience 4.9/5 stars on average.",
      stat: "4.9/5",
    },
  ];

  const faqs = [
    {
      question: "How does the AI bargaining actually work?",
      answer:
        "Our AI analyzes real-time pricing data, demand patterns, and supplier inventory to identify negotiation opportunities. It then automatically submits competitive offers to secure better deals on your behalf.",
    },
    {
      question: "Is there any extra cost for using the AI negotiation?",
      answer:
        "No, our AI bargaining service is completely free for all users. We earn a small commission from suppliers when we secure bookings, but this doesn't affect your price.",
    },
    {
      question: "What if the AI can't find a better deal?",
      answer:
        "You'll still get competitive standard rates, and we'll continue monitoring for opportunities to enhance your booking with upgrades or perks.",
    },
    {
      question: "How quickly do I get results?",
      answer:
        "Our AI works in real-time, so you'll see enhanced offers within seconds of your search. The negotiation process is completely automated and instant.",
    },
    {
      question: "Can I trust the AI with my booking?",
      answer:
        "Absolutely! Our AI is trained on millions of successful transactions and is continuously monitored by our team. Plus, all bookings come with our guarantee and 24/7 support.",
    },
  ];

  return (
    <Layout showSearch={false}>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-[#003580] via-[#0071c2] to-[#003580] text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            How Faredown Works
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Discover how our revolutionary AI technology negotiates better
            travel deals for you automatically.
          </p>
          <div className="flex items-center justify-center gap-6 text-blue-200 text-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              <span>Instant Results</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-400" />
              <span>100% Secure</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Process is Simple
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Four easy steps to unlock better travel deals with the power of AI
            </p>
          </div>

          {/* Desktop View */}
          <div className="hidden md:grid md:grid-cols-4 gap-8 mb-16">
            {steps.map((step, index) => (
              <div key={step.id} className="text-center">
                <div className="relative mb-6">
                  <div
                    className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4`}
                  >
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.id}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-200 -translate-x-8"></div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 mb-4">{step.description}</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-green-500 mr-1 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-6 mb-16">
            {steps.map((step, index) => (
              <Card key={step.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <div
                        className={`w-12 h-12 ${step.color} rounded-full flex items-center justify-center`}
                      >
                        <step.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {step.id}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{step.description}</p>
                      <ul className="text-sm text-gray-500 space-y-1">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-center">
                            <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Makes Us Different
            </h2>
            <p className="text-xl text-gray-600">
              Advanced technology meets exceptional user experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {feature.description}
                      </p>
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit, idx) => (
                          <li
                            key={idx}
                            className="flex items-center text-sm text-gray-700"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Results Speak for Themselves
            </h2>
            <p className="text-xl text-gray-600">
              Real benefits that our users experience every day
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {benefit.stat}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Covered */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Services We Cover
            </h2>
            <p className="text-xl text-gray-600">
              AI bargaining across all major travel categories
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Flights
                </h3>
                <p className="text-gray-600 mb-4">
                  Seat upgrades, lounge access, priority boarding, and better
                  fares across 500+ airlines.
                </p>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Business class upgrades</li>
                  <li>• Extra legroom seats</li>
                  <li>• Priority check-in</li>
                  <li>• Baggage allowances</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hotel className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Hotels
                </h3>
                <p className="text-gray-600 mb-4">
                  Room upgrades, late checkout, complimentary breakfast, and
                  exclusive amenities.
                </p>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Suite upgrades</li>
                  <li>• Free breakfast</li>
                  <li>• Late checkout</li>
                  <li>• Spa credits</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Transfers
                </h3>
                <p className="text-gray-600 mb-4">
                  Vehicle upgrades, additional stops, VIP service, and premium
                  transfer experiences.
                </p>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Luxury vehicle upgrades</li>
                  <li>• Meet & greet service</li>
                  <li>• Additional stops</li>
                  <li>• Priority scheduling</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our AI bargaining process
            </p>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#003580] to-[#0071c2] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Experience AI-Powered Travel?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of smart travelers who are already saving money and
            getting upgrades with our AI technology.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button className="bg-white text-blue-600 px-8 py-4 text-lg font-semibold hover:bg-blue-50 transition-colors">
              Start Your Search
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              className="border-2 border-white text-white px-8 py-4 text-lg font-semibold hover:bg-white/10 transition-colors"
            >
              View Sample Deals
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
