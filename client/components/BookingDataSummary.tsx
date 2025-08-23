import React from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function BookingDataSummary() {
  const { booking } = useBooking();

  if (!booking) return null;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Booking Data Summary</span>
          <Badge variant={booking.isComplete ? "default" : "secondary"}>
            {booking.isComplete ? "Complete" : `Step ${booking.currentStep}`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Parameters */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Search Parameters</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Route:</span> {booking.searchParams.from} → {booking.searchParams.to}
            </div>
            <div>
              <span className="font-medium">Codes:</span> {booking.searchParams.fromCode} → {booking.searchParams.toCode}
            </div>
            <div>
              <span className="font-medium">Departure:</span> {booking.searchParams.departureDate}
            </div>
            <div>
              <span className="font-medium">Return:</span> {booking.searchParams.returnDate || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Trip Type:</span> {booking.searchParams.tripType}
            </div>
            <div>
              <span className="font-medium">Class:</span> {booking.searchParams.class}
            </div>
            <div>
              <span className="font-medium">Passengers:</span> 
              {booking.searchParams.passengers.adults}A/{booking.searchParams.passengers.children}C/{booking.searchParams.passengers.infants}I
            </div>
            <div>
              <span className="font-medium">Airline:</span> {booking.searchParams.airline || 'Any'}
            </div>
          </div>
        </div>

        {/* Selected Flight */}
        {booking.selectedFlight && (
          <div>
            <h3 className="font-semibold text-lg mb-2">Selected Flight</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Airline:</span> {booking.selectedFlight.airline}
              </div>
              <div>
                <span className="font-medium">Flight Number:</span> {booking.selectedFlight.flightNumber}
              </div>
              <div>
                <span className="font-medium">Departure:</span> {booking.selectedFlight.departureTime} from {booking.selectedFlight.departureCode}
              </div>
              <div>
                <span className="font-medium">Arrival:</span> {booking.selectedFlight.arrivalTime} at {booking.selectedFlight.arrivalCode}
              </div>
              <div>
                <span className="font-medium">Duration:</span> {booking.selectedFlight.duration}
              </div>
              <div>
                <span className="font-medium">Aircraft:</span> {booking.selectedFlight.aircraft}
              </div>
              {booking.selectedFlight.returnFlightNumber && (
                <>
                  <div>
                    <span className="font-medium">Return Flight:</span> {booking.selectedFlight.returnFlightNumber}
                  </div>
                  <div>
                    <span className="font-medium">Return Time:</span> {booking.selectedFlight.returnDepartureTime} - {booking.selectedFlight.returnArrivalTime}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Selected Fare */}
        {booking.selectedFare && (
          <div>
            <h3 className="font-semibold text-lg mb-2">Selected Fare</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {booking.selectedFare.name}
              </div>
              <div>
                <span className="font-medium">Type:</span> {booking.selectedFare.type}
              </div>
              <div>
                <span className="font-medium">Price:</span> ₹{booking.selectedFare.price.toLocaleString()}
                {booking.selectedFare.isBargained && booking.selectedFare.originalPrice && (
                  <span className="ml-2 text-green-600">
                    (Saved ₹{(booking.selectedFare.originalPrice - booking.selectedFare.price).toLocaleString()})
                  </span>
                )}
              </div>
              <div>
                <span className="font-medium">Refundable:</span> 
                <Badge variant={booking.selectedFare.isRefundable ? "default" : "secondary"} className="ml-2">
                  {booking.selectedFare.isRefundable ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Bargained:</span> 
                <Badge variant={booking.selectedFare.isBargained ? "default" : "secondary"} className="ml-2">
                  {booking.selectedFare.isBargained ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Baggage:</span> {booking.selectedFare.includedBaggage}
              </div>
              <div>
                <span className="font-medium">Meals:</span> {booking.selectedFare.includedMeals ? "Included" : "Extra"}
              </div>
              <div>
                <span className="font-medium">Seat Selection:</span> {booking.selectedFare.seatSelection ? "Included" : "Extra"}
              </div>
            </div>
          </div>
        )}

        {/* Travellers */}
        {booking.travellers.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-2">Travellers ({booking.travellers.length})</h3>
            <div className="space-y-2">
              {booking.travellers.map((traveller, index) => (
                <div key={traveller.id} className="text-sm border-l-2 border-blue-500 pl-3">
                  <div className="font-medium">
                    {traveller.firstName} {traveller.lastName} ({traveller.type})
                  </div>
                  <div className="text-gray-600">
                    {traveller.gender && `${traveller.gender} • `}
                    {traveller.dateOfBirth && `DOB: ${traveller.dateOfBirth} • `}
                    {traveller.nationality}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Details */}
        {booking.contactDetails.email && (
          <div>
            <h3 className="font-semibold text-lg mb-2">Contact Details</h3>
            <div className="text-sm">
              <div><span className="font-medium">Email:</span> {booking.contactDetails.email}</div>
              <div><span className="font-medium">Phone:</span> {booking.contactDetails.countryCode} {booking.contactDetails.phone}</div>
            </div>
          </div>
        )}

        {/* Price Breakdown */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Price Breakdown</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Base Fare:</span>
              <span>₹{booking.priceBreakdown.baseFare.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes & Fees:</span>
              <span>₹{(booking.priceBreakdown.taxes + booking.priceBreakdown.fees).toLocaleString()}</span>
            </div>
            {booking.priceBreakdown.extras > 0 && (
              <div className="flex justify-between">
                <span>Extras:</span>
                <span>₹{booking.priceBreakdown.extras.toLocaleString()}</span>
              </div>
            )}
            {booking.priceBreakdown.seats > 0 && (
              <div className="flex justify-between">
                <span>Seat Fees:</span>
                <span>₹{booking.priceBreakdown.seats.toLocaleString()}</span>
              </div>
            )}
            {booking.priceBreakdown.insurance > 0 && (
              <div className="flex justify-between">
                <span>Insurance:</span>
                <span>₹{booking.priceBreakdown.insurance.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg border-t pt-1">
              <span>Total:</span>
              <span>₹{booking.priceBreakdown.total.toLocaleString()}</span>
            </div>
            {booking.priceBreakdown.savings > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>You Saved:</span>
                <span>₹{booking.priceBreakdown.savings.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Booking Status */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Booking Status</h3>
          <div className="text-sm">
            <div><span className="font-medium">Current Step:</span> {booking.currentStep}/5</div>
            <div><span className="font-medium">Complete:</span> {booking.isComplete ? "Yes" : "No"}</div>
            {booking.bookingId && <div><span className="font-medium">Booking ID:</span> {booking.bookingId}</div>}
            {booking.paymentStatus && <div><span className="font-medium">Payment:</span> {booking.paymentStatus}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
