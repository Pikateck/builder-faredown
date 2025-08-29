import React from "react";
import { Layout } from "../components/layout/Layout";
import { Card, CardContent } from "../components/ui/card";
import {
  Users,
  Globe,
  Award,
  Shield,
  Heart,
  Target,
  Sparkles,
  TrendingUp,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const About = () => {
  const stats = [
    { label: "Happy Travelers", value: "50,000+", icon: Users },
    { label: "Countries Covered", value: "180+", icon: Globe },
    { label: "AI Savings Generated", value: "$2M+", icon: TrendingUp },
    { label: "Customer Satisfaction", value: "4.9/5", icon: Award },
  ];

  const values = [
    {
      icon: Shield,
      title: "Trust & Security",
      description:
        "Your data and payments are protected with enterprise-grade security.",
      color: "bg-blue-500",
    },
    {
      icon: Heart,
      title: "Customer First",
      description:
        "Every decision we make is centered around improving your travel experience.",
      color: "bg-red-500",
    },
    {
      icon: Sparkles,
      title: "Innovation",
      description:
        "We leverage cutting-edge AI technology to revolutionize how you book travel.",
      color: "bg-purple-500",
    },
    {
      icon: Target,
      title: "Transparency",
      description:
        "No hidden fees, no surprises. What you see is what you pay.",
      color: "bg-green-500",
    },
  ];

  const team = [
    {
      name: "Zubin Aibara",
      role: "Founder & CEO",
      image:
        "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F8c87258c0ecd41ac881b0f2489cecf7d?format=webp&width=400",
      description:
        "Visionary leader with 15+ years in travel technology and AI innovation.",
    },
    {
      name: "Priya Sharma",
      role: "Chief Technology Officer",
      image:
        "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F8c87258c0ecd41ac881b0f2489cecf7d?format=webp&width=400",
      description:
        "AI expert leading our bargaining algorithm development and platform architecture.",
    },
    {
      name: "Rahul Kumar",
      role: "Head of Customer Experience",
      image:
        "https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F8c87258c0ecd41ac881b0f2489cecf7d?format=webp&width=400",
      description:
        "Ensuring every customer interaction exceeds expectations across all touchpoints.",
    },
  ];

  const achievements = [
    "First AI-powered travel bargaining platform in Asia",
    "Winner of TravelTech Innovation Award 2024",
    "Partnered with 500+ airlines and hotels globally",
    "Featured in Forbes Asia's Top Travel Startups",
    "ISO 27001 certified for data security",
    "Carbon-neutral booking platform",
  ];

  return (
    <Layout showSearch={false}>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-[#003580] via-[#0071c2] to-[#003580] text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Revolutionizing Travel with AI
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            We're on a mission to make premium travel accessible to everyone
            through the power of artificial intelligence and smart bargaining.
          </p>
          <div className="flex items-center justify-center gap-6 text-blue-200 text-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span>Trusted by 50,000+</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span>Award Winning</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Founded in 2023, Faredown was born from a simple observation:
                  premium travel experiences were often priced out of reach for
                  everyday travelers. Our founder, Zubin Aibara, experienced
                  this firsthand when planning a family vacation.
                </p>
                <p>
                  "Why should only the wealthy enjoy premium upgrades?" he
                  wondered. This question sparked the idea for an AI-powered
                  platform that could negotiate better deals on behalf of
                  travelers.
                </p>
                <p>
                  Today, our revolutionary bargaining algorithm has saved
                  travelers over $2 million while securing premium upgrades,
                  better seats, and exclusive perks that were previously only
                  available to VIP customers.
                </p>
              </div>
              <div className="mt-8">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                  <p className="text-blue-800 font-medium italic">
                    "Our mission is to democratize premium travel and make
                    extraordinary journeys accessible to everyone."
                  </p>
                  <p className="text-blue-600 text-sm mt-2">
                    - Zubin Aibara, Founder & CEO
                  </p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F4235b10530ff469795aa00c0333d773c%2F8c87258c0ecd41ac881b0f2489cecf7d?format=webp&width=600"
                alt="Faredown Team"
                className="rounded-xl shadow-lg w-full h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              These core principles guide everything we do, from product
              development to customer service.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-12 h-12 ${value.color} rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <value.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {value.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Leadership Team
            </h2>
            <p className="text-xl text-gray-600">
              Meet the visionaries behind Faredown's innovation
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-8">
                  <div className="w-24 h-24 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 font-medium mb-4">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {member.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Achievements
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Since our launch, we've achieved remarkable milestones that
                reflect our commitment to innovation and customer satisfaction.
              </p>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8">
              <div className="text-center">
                <Award className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Award-Winning Innovation
                </h3>
                <p className="text-gray-600 mb-6">
                  Recognized globally for our groundbreaking approach to travel
                  technology and customer experience.
                </p>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-lg font-semibold text-gray-900">
                      TravelTech Innovation Award
                    </div>
                    <div className="text-sm text-gray-600">
                      Best AI-Powered Platform 2024
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-lg font-semibold text-gray-900">
                      Forbes Asia Recognition
                    </div>
                    <div className="text-sm text-gray-600">
                      Top Travel Startup 2024
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#003580] to-[#0071c2] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Experience the Future of Travel?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of smart travelers who are already saving money and
            getting premium upgrades with our AI-powered platform.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center">
              Start Your Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Learn How It Works
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
