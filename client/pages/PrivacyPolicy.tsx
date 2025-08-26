import React from "react";
import { Layout } from "@/components/layout/Layout";

export default function PrivacyPolicy() {
  return (
    <Layout showSearch={false}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          
          <div className="text-sm text-gray-600 mb-8">
            <strong>Effective Date:</strong> August 26, 2025
          </div>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              Faredown.com ("Faredown," "we," "our," or "us") values your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use our website, mobile apps, or services (collectively, the "Platform").
            </p>
            
            <p className="mb-6">
              By using Faredown.com, you agree to the practices described in this Privacy Policy.
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="mb-4">We may collect the following categories of personal and non-personal data:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Identity & Contact Information:</strong> Name, email address, phone number, address, date of birth.</li>
                <li><strong>Booking Information:</strong> Passport details, travel preferences, flight/hotel details, special requests.</li>
                <li><strong>Payment Information:</strong> Credit/debit card details, UPI, wallets, and other payment methods (processed via third-party gateways).</li>
                <li><strong>Device & Technical Information:</strong> IP address, browser type, OS, device identifiers, geolocation.</li>
                <li><strong>Usage Data:</strong> Search history, preferences, interactions with our Platform.</li>
                <li><strong>Cookies & Tracking:</strong> Session cookies, analytics tags, and similar technologies (see Section 6).</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">We use your data for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Processing bookings, cancellations, and refunds.</li>
                <li>Providing customer support and account management.</li>
                <li>Personalizing recommendations using our <strong>AI Bargaining Engine</strong>.</li>
                <li>Sending confirmations, alerts, and promotional offers (with opt-out option).</li>
                <li>Improving security, performance, and user experience.</li>
                <li>Compliance with legal obligations.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Data Sharing & Disclosure</h2>
              <p className="mb-4">We may share your information only in the following cases:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>With Travel Suppliers:</strong> Airlines, hotels, sightseeing operators, transfer providers, etc., to complete bookings.</li>
                <li><strong>With Service Providers:</strong> Payment gateways, IT/cloud providers, analytics and marketing tools.</li>
                <li><strong>For Legal Compliance:</strong> To law enforcement or regulators when required by law.</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or asset sale, data may be transferred with safeguards.</li>
              </ul>
              <p className="mt-4 font-semibold">We do not sell or rent your personal data to third parties.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>We use <strong>encryption (SSL/TLS)</strong>, secure firewalls, and multi-layered authentication.</li>
                <li>Sensitive payment data is processed only by <strong>PCI-DSS compliant payment gateways</strong>.</li>
                <li>Access to personal data is restricted to authorized personnel under confidentiality obligations.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>We retain booking and payment data only as long as necessary for legal, tax, or accounting purposes.</li>
                <li>User accounts may request deletion (see Section 8).</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies & Tracking</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>We use cookies to remember your preferences, enable faster searches, and provide analytics.</li>
                <li>You can manage or disable cookies in your browser/app settings, though some features may not work properly.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights (GDPR + Indian IT Act)</h2>
              <p className="mb-4">Depending on your jurisdiction, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and receive a copy of your data.</li>
                <li>Request correction of inaccurate information.</li>
                <li>Request deletion ("Right to be Forgotten").</li>
                <li>Restrict or object to processing.</li>
                <li>Withdraw consent at any time (e.g., for marketing emails).</li>
                <li>Port your data to another provider (GDPR).</li>
              </ul>
              <p className="mt-4">
                Requests can be made via <strong><a href="mailto:support@faredown.com" className="text-blue-600 hover:underline">support@faredown.com</a></strong>. We will respond within <strong>30 days</strong>.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
              <p>
                Our services are <strong>not intended for users under 18 years</strong>. We do not knowingly collect data from minors. If discovered, such data will be deleted immediately.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
              <p>
                Your data may be processed outside your home country, but always under adequate safeguards (e.g., EU Standard Contractual Clauses for GDPR).
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Third-Party Links</h2>
              <p>
                Our Platform may link to third-party websites. We are not responsible for their privacy practices. Please review their policies before sharing data.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to this Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Any material changes will be notified via the Platform or email. Continued use after updates constitutes acceptance.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
              <p>For privacy-related requests, please contact:</p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="font-semibold">Faredown Bookings and Travels Pvt Ltd (Faredown.com)</p>
                <p>Registered Office: [Insert Mumbai Office Address]</p>
                <p>Email: <a href="mailto:support@faredown.com" className="text-blue-600 hover:underline">support@faredown.com</a></p>
              </div>
            </section>
            
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-8">
              <div className="text-green-800">
                <p className="font-semibold">Data Protection Commitment</p>
                <p className="text-sm mt-2">
                  All proprietary algorithms, including our AI-powered Bargaining Engine, remain the exclusive property of Faredown Bookings and Travels Pvt Ltd. No third-party entity has rights to use, modify, or claim ownership of any part of this system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
