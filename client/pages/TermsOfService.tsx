import React from "react";
import { Layout } from "@/components/layout/Layout";

export default function TermsOfService() {
  return (
    <Layout showSearch={false}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          
          <div className="text-sm text-gray-600 mb-8">
            <strong>Effective Date:</strong> August 26, 2025
          </div>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              Welcome to <strong>Faredown.com</strong>, a travel booking and AI-powered bargaining platform operated by{" "}
              <strong>Faredown Bookings and Travels Pvt Ltd</strong> ("Faredown," "we," "our," or "us"). By accessing or using our website, mobile apps, or services (collectively, the "Platform"), you agree to these{" "}
              <strong>Terms of Service</strong>. If you do not agree, please do not use Faredown.com.
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Ownership & Intellectual Property</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>The Platform, including its design, source code, algorithms (including the AI Bargaining Engine), APIs, user interfaces, content, branding, and business logic, are the <strong>exclusive property of Faredown Bookings and Travels Pvt Ltd</strong>.</li>
                <li>No third-party (including Pikateck Technologies or any other entity) has any claim of ownership over this Platform.</li>
                <li>Users are granted a <strong>limited, non-exclusive, non-transferable license</strong> to use the Platform only for personal travel bookings.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Eligibility to Use</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be <strong>18 years or older</strong> and legally capable of entering into binding contracts.</li>
                <li>By using the Platform, you represent that the information you provide is <strong>accurate and complete</strong>.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Our Services</h2>
              <p className="mb-4">Faredown.com provides:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Flight, hotel, sightseeing, transfers, and related travel bookings.</li>
                <li>AI-powered price bargaining functionality.</li>
                <li>Partnered services offered through airlines, hotels, and third-party suppliers.</li>
              </ul>
              <p className="mt-4">
                We act as an <strong>intermediary</strong> between you and travel suppliers. Confirmations, cancellations, and refunds are subject to supplier policies.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You agree to use the Platform <strong>lawfully</strong> and only for intended purposes.</li>
                <li>You must not copy, scrape, reverse-engineer, or exploit the Platform for unauthorized commercial use.</li>
                <li>You are responsible for maintaining the confidentiality of your account.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Payments & Fees</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All bookings are subject to payment in the displayed currency at the time of checkout.</li>
                <li>Fees may include service charges, convenience fees, or commissions as disclosed at booking.</li>
                <li>Payment gateways are provided by third-party processors. Faredown is not liable for issues caused by such processors.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cancellations & Refunds</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All cancellations, changes, and refunds are governed by the <strong>airline/hotel/supplier policies</strong>.</li>
                <li>Faredown may levy a service fee in addition to supplier fees.</li>
                <li>Refund timelines depend on suppliers and payment gateways.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Faredown acts only as a booking facilitator and is <strong>not liable</strong> for acts, omissions, delays, cancellations, or defaults of airlines, hotels, transporters, or other suppliers.</li>
                <li>We are not responsible for losses arising from force majeure events (e.g., strikes, weather, system outages).</li>
                <li>Maximum liability, if any, shall not exceed the amount paid for the specific booking.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacy & Data Protection</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>We collect and process your personal data as per our <strong>Privacy Policy</strong>.</li>
                <li>We do not sell or rent your information to third parties.</li>
                <li>All proprietary data, including AI-driven pricing analytics, remains the exclusive property of Faredown.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Prohibited Activities</h2>
              <p className="mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use bots, crawlers, or automated tools to access the Platform.</li>
                <li>Misrepresent information, attempt fraudulent bookings, or misuse promotions.</li>
                <li>Reproduce, distribute, or sublicense any part of the Platform without written approval.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Intellectual Property Rights Notice</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>© 2025 <strong>Faredown Bookings and Travels Pvt Ltd. All rights reserved.</strong></li>
                <li>"Faredown.com" and associated branding are registered marks of Faredown Bookings and Travels Pvt Ltd.</li>
                <li>Unauthorized use will result in <strong>legal action</strong> under applicable law.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Faredown may suspend or terminate your account if you breach these Terms.</li>
                <li>On termination, your right to use the Platform ceases immediately.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Dispute Resolution & Governing Law</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>These Terms are governed by the <strong>laws of India</strong>.</li>
                <li>Disputes shall be subject to the exclusive jurisdiction of the courts of <strong>Mumbai, Maharashtra, India</strong>.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Amendments</h2>
              <p>We may update these Terms from time to time. Continued use of the Platform after updates constitutes acceptance of the revised Terms.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
              <p>For any queries:</p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="font-semibold">Faredown Bookings and Travels Pvt Ltd</p>
                <p>Registered Office: [Insert Mumbai Address]</p>
                <p>Email: <a href="mailto:support@faredown.com" className="text-blue-600 hover:underline">support@faredown.com</a></p>
              </div>
            </section>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-8">
              <div className="text-blue-800">
                <p className="font-semibold">Legal Disclaimer</p>
                <p className="text-sm mt-2">
                  This platform, including but not limited to its source code, user interface designs, APIs, databases, business logic, and all associated intellectual property, is the sole property of Faredown Bookings and Travels Pvt Ltd ("Faredown.com"). Any unauthorized reproduction, redistribution, or derivative use of this platform, its modules, or its designs is strictly prohibited.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
