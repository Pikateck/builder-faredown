import React from "react";
import { Layout } from "@/components/layout/Layout";

export default function RefundCancellationPolicy() {
  return (
    <Layout showSearch={false}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Refund & Cancellation Policy
          </h1>

          <div className="text-sm text-gray-600 mb-8">
            <strong>Effective Date:</strong> August 26, 2025
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              At <strong>Faredown.com</strong> (operated by{" "}
              <strong>Faredown Bookings and Travels Pvt Ltd</strong>), we aim to
              provide a seamless booking and bargaining experience. As a
              facilitator, we connect customers with airlines, hotels,
              sightseeing operators, transfer providers, and other travel
              suppliers. All cancellations and refunds are therefore subject to
              both <strong>supplier rules</strong> and Faredown's own service
              conditions.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. General Rules
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  All bookings made on Faredown.com are{" "}
                  <strong>non-transferable</strong>.
                </li>
                <li>
                  Cancellations, amendments, and refunds are governed by the{" "}
                  <strong>airline/hotel/supplier's fare rules</strong> as
                  displayed at the time of booking.
                </li>
                <li>
                  Service fees and convenience charges charged by Faredown are{" "}
                  <strong>non-refundable</strong>.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Flight Bookings
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Airline Policies Apply:</strong> Refunds and
                  cancellations depend strictly on the airline's fare class,
                  ticket type, and conditions.
                </li>
                <li>
                  <strong>Non-Refundable Fares:</strong> Some discounted or
                  promotional fares may be completely non-refundable.
                </li>
                <li>
                  <strong>Cancellation Charges:</strong> Airline penalties +
                  Faredown service fee will be deducted.
                </li>
                <li>
                  <strong>No-Show:</strong> Tickets are non-refundable in case
                  of no-show (failure to board).
                </li>
                <li>
                  <strong>Timeline:</strong> Refunds, if eligible, are usually
                  processed within <strong>7–21 working days</strong>, depending
                  on airline and payment gateway.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Hotel Bookings
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Supplier Policy Applies:</strong> Cancellation
                  deadlines vary by hotel (e.g., free cancellation until X date,
                  charge thereafter).
                </li>
                <li>
                  <strong>Non-Refundable Rooms:</strong> Some room rates are
                  non-refundable, as clearly mentioned at booking.
                </li>
                <li>
                  <strong>Early Check-Out/No-Show:</strong> No refunds for
                  unused nights in case of early departure or no-show.
                </li>
                <li>
                  <strong>Timeline:</strong> Refunds, if eligible, are usually
                  processed within <strong>7–14 working days</strong>.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Sightseeing & Activities
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Activities/tours may be fully refundable if canceled before
                  the supplier's cut-off time (displayed at booking).
                </li>
                <li>
                  Late cancellations or no-shows are generally{" "}
                  <strong>non-refundable</strong>.
                </li>
                <li>
                  Weather-related cancellations may qualify for a refund or
                  rescheduling, as per supplier policy.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Transfers (Airport Taxi & Car Rentals)
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Airport Taxi:</strong> Refundable only if canceled
                  within the supplier's allowed window (typically 24 hours
                  before pickup).
                </li>
                <li>
                  <strong>Car Rentals:</strong> Cancellation and refund depend
                  on rental agency rules (fuel, mileage, early return penalties
                  may apply).
                </li>
                <li>
                  <strong>No-Show at Pickup:</strong> Non-refundable.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Refund Process
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Refunds will be issued back to the{" "}
                  <strong>original mode of payment</strong>.
                </li>
                <li>
                  Faredown service fees, payment gateway charges, and supplier
                  penalties are deducted before refund.
                </li>
                <li>
                  Refund timelines depend on{" "}
                  <strong>
                    supplier confirmation and payment processor speed
                  </strong>
                  .
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Special Conditions
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  In case of{" "}
                  <strong>
                    flight schedule changes, rescheduling, or supplier
                    cancellations
                  </strong>
                  , Faredown will facilitate refunds or alternatives as provided
                  by the supplier.
                </li>
                <li>
                  For <strong>force majeure events</strong> (e.g., natural
                  disasters, strikes, pandemics), refunds will depend solely on
                  supplier rules.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. How to Request a Cancellation/Refund
              </h2>
              <p className="mb-4">Customers can request through:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>My Bookings</strong> section on Faredown.com / mobile
                  app
                </li>
                <li>
                  Emailing{" "}
                  <strong>
                    <a
                      href="mailto:support@faredown.com"
                      className="text-blue-600 hover:underline"
                    >
                      support@faredown.com
                    </a>
                  </strong>{" "}
                  with booking details
                </li>
                <li>Calling our 24x7 customer support team</li>
              </ul>
              <p className="mt-4">
                Refund eligibility will be checked against supplier rules before
                processing.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Contact for Refund Queries
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">
                  Faredown Bookings and Travels Pvt Ltd (Faredown.com)
                </p>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:support@faredown.com"
                    className="text-blue-600 hover:underline"
                  >
                    support@faredown.com
                  </a>
                </p>
                <p>Phone: [Insert Support Number]</p>
              </div>
            </section>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-8">
              <div className="text-yellow-800">
                <p className="font-semibold">⚖️ Important Note:</p>
                <p className="text-sm mt-2">
                  Faredown.com is a <strong>booking facilitator</strong>. Final
                  decision on refunds rests with the{" "}
                  <strong>airline, hotel, or supplier</strong>. Faredown's
                  responsibility is limited to facilitating communication and
                  refund processing as per supplier rules.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-8">
              <div className="text-blue-800">
                <p className="font-semibold">Customer Protection</p>
                <p className="text-sm mt-2">
                  For disputes related to refunds, customers may approach the
                  appropriate consumer forums as per Indian Consumer Protection
                  Act, 2019. Faredown Bookings and Travels Pvt Ltd maintains
                  transparency in all refund processes and follows industry best
                  practices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
