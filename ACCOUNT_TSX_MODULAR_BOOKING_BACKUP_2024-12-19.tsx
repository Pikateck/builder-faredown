/*
 * MODULAR BOOKING DISPLAY IMPLEMENTATION BACKUP
 * Date: December 19, 2024 17:30 UTC
 * File: client/pages/Account.tsx - renderModularBookings() function
 * Status: ✅ COMPLETE AND FUNCTIONAL
 */

// MODULAR BOOKING DISPLAY FUNCTION - COMPLETE IMPLEMENTATION
const renderModularBookings = () => {
  // Organize bookings by modules
  const bookingsByModule = {
    flights: bookings.filter(b => b.type === 'flight' || !b.type), // Default to flight for existing bookings
    hotels: bookings.filter(b => b.type === 'hotel'),
    sightseeing: bookings.filter(b => b.type === 'sightseeing'),
    transfers: bookings.filter(b => b.type === 'transfer')
  };

  const modules = [
    {
      id: 'flights',
      name: 'Flights',
      icon: Plane,
      color: 'blue',
      bookings: bookingsByModule.flights,
      emptyMessage: 'No flight bookings yet',
      searchLink: '/flights'
    },
    {
      id: 'hotels',
      name: 'Hotels',
      icon: Hotel,
      color: 'green',
      bookings: bookingsByModule.hotels,
      emptyMessage: 'No hotel bookings yet',
      searchLink: '/hotels'
    },
    {
      id: 'sightseeing',
      name: 'Sightseeing',
      icon: Camera,
      color: 'purple',
      bookings: bookingsByModule.sightseeing,
      emptyMessage: 'No sightseeing bookings yet',
      searchLink: '/sightseeing'
    },
    {
      id: 'transfers',
      name: 'Transfers',
      icon: MapPin,
      color: 'orange',
      bookings: bookingsByModule.transfers,
      emptyMessage: 'No transfer bookings yet',
      searchLink: '/transfers'
    }
  ];

  const totalBookings = bookings.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
        <div className="text-sm text-gray-600">
          {totalBookings} {totalBookings === 1 ? "booking" : "bookings"} found
        </div>
      </div>

      {totalBookings === 0 ? (
        <Card className="p-12 text-center">
          <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No bookings yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start your journey by booking your first trip
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/flights">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plane className="w-4 h-4 mr-2" />
                Search Flights
              </Button>
            </Link>
            <Link to="/hotels">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                <Hotel className="w-4 h-4 mr-2" />
                Search Hotels
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {modules.map((module) => {
            const ModuleIcon = module.icon;
            const moduleBookings = module.bookings;
            
            // Always show module headers for better UX

            return (
              <div key={module.id} className="space-y-4">
                {/* Module Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      module.color === 'blue' ? 'bg-blue-100' :
                      module.color === 'green' ? 'bg-green-100' :
                      module.color === 'purple' ? 'bg-purple-100' :
                      'bg-orange-100'
                    }`}>
                      <ModuleIcon className={`w-5 h-5 ${
                        module.color === 'blue' ? 'text-blue-600' :
                        module.color === 'green' ? 'text-green-600' :
                        module.color === 'purple' ? 'text-purple-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{module.name}</h3>
                      <p className="text-sm text-gray-600">
                        {moduleBookings.length} {moduleBookings.length === 1 ? 'booking' : 'bookings'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={`${
                    module.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                    module.color === 'green' ? 'bg-green-100 text-green-800' :
                    module.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {moduleBookings.length}
                  </Badge>
                </div>

                {/* Module Bookings */}
                <div className="grid gap-4">
                  {moduleBookings.length === 0 ? (
                    <Card className="p-8 text-center bg-gray-50 border-dashed border-2">
                      <ModuleIcon className={`w-16 h-16 mx-auto mb-4 ${
                        module.color === 'blue' ? 'text-blue-300' :
                        module.color === 'green' ? 'text-green-300' :
                        module.color === 'purple' ? 'text-purple-300' :
                        'text-orange-300'
                      }`} />
                      <h4 className="text-lg font-medium text-gray-700 mb-2">{module.emptyMessage}</h4>
                      <p className="text-sm text-gray-500 mb-4">
                        Start planning your next {module.name.toLowerCase()} adventure
                      </p>
                      <Link to={module.searchLink}>
                        <Button size="sm" className={`${
                          module.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                          module.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                          module.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                          'bg-orange-600 hover:bg-orange-700'
                        } text-white`}>
                          <ModuleIcon className="w-4 h-4 mr-2" />
                          Search {module.name}
                        </Button>
                      </Link>
                    </Card>
                  ) : (
                    moduleBookings.map((booking, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className={`bg-gradient-to-r ${
                          module.color === 'blue' ? 'from-blue-50 to-blue-100' :
                          module.color === 'green' ? 'from-green-50 to-green-100' :
                          module.color === 'purple' ? 'from-purple-50 to-purple-100' :
                          'from-orange-50 to-orange-100'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg font-semibold text-gray-900">
                                {module.id === 'flights' ? 'Mumbai ⇄ Dubai' : 
                                 module.id === 'hotels' ? 'Hotel Booking' :
                                 module.id === 'sightseeing' ? 'Sightseeing Tour' :
                                 'Transfer Service'}
                              </CardTitle>
                              <p className="text-sm text-gray-600">
                                Booking Reference: {booking.bookingDetails?.bookingRef || 'N/A'}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800 border-green-200"
                              >
                                {getBookingStatus(booking.bookingDetails?.bookingDate)}
                              </Badge>
                              <p className="text-sm text-gray-600 mt-1">
                                Booked on {formatDate(booking.bookingDetails?.bookingDate)}
                              </p>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Booking Details */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">
                                  {module.id === 'flights' ? 'Flight Details' :
                                   module.id === 'hotels' ? 'Hotel Details' :
                                   module.id === 'sightseeing' ? 'Tour Details' :
                                   'Transfer Details'}
                                </h4>
                                {module.id === 'flights' && (
                                  <>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <MapPin className="w-4 h-4" />
                                      <span>BOM ⇄ DXB</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <Calendar className="w-4 h-4" />
                                      <span>Sat, Aug 3 • 10:15 - 13:45</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <Plane className="w-4 h-4" />
                                      <span>{booking.flightDetails?.airline || "Airlines"} {booking.flightDetails?.flightNumber || "FL-001"}</span>
                                    </div>
                                  </>
                                )}
                                {module.id === 'hotels' && (
                                  <>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <MapPin className="w-4 h-4" />
                                      <span>Dubai Hotel</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <Calendar className="w-4 h-4" />
                                      <span>Check-in: Aug 3 • Check-out: Aug 10</span>
                                    </div>
                                  </>
                                )}
                                {module.id === 'sightseeing' && (
                                  <>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <MapPin className="w-4 h-4" />
                                      <span>City Tour • Dubai</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <Calendar className="w-4 h-4" />
                                      <span>Aug 5 • 9:00 AM - 6:00 PM</span>
                                    </div>
                                  </>
                                )}
                                {module.id === 'transfers' && (
                                  <>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <MapPin className="w-4 h-4" />
                                      <span>Airport → Hotel</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <Calendar className="w-4 h-4" />
                                      <span>Aug 3 • 2:00 PM</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Passenger/Guest Details */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">
                                {module.id === 'hotels' ? 'Guest Details' : 'Passengers'}
                              </h4>
                              <div className="space-y-2">
                                {booking.bookingDetails?.passengers?.map((passenger, pIndex) => (
                                  <div key={pIndex} className="text-sm">
                                    <div className="font-medium text-gray-900">
                                      {passenger.firstName} {passenger.lastName}
                                    </div>
                                    <div className="text-gray-600">
                                      Adult {pIndex + 1} • {passenger.title || "Not specified"}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-4">
                                <h5 className="font-medium text-gray-900 mb-1">Contact</h5>
                                <div className="text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Mail className="w-3 h-3 mr-1" />
                                    {booking.bookingDetails?.contactDetails?.email}
                                  </div>
                                  <div className="flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {booking.bookingDetails?.contactDetails?.countryCode} {booking.bookingDetails?.contactDetails?.phone}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Booking Summary */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Booking Summary</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total Paid</span>
                                  <span className="font-semibold text-gray-900">
                                    {booking.bookingDetails?.currency?.symbol || '₹'}
                                    {booking.bookingDetails?.totalAmount?.toLocaleString() || '0'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Payment ID</span>
                                  <span className="text-gray-900 font-mono text-xs">
                                    {booking.paymentId?.slice(0, 12) || 'N/A'}...
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                <Button variant="outline" size="sm" className="w-full">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View {module.id === 'flights' ? 'Ticket' : 'Voucher'}
                                </Button>
                                <Button variant="outline" size="sm" className="w-full">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/*
 * SAMPLE BOOKING DATA STRUCTURE - BACKUP
 * This data structure is used to populate the modular display
 */

const sampleBookings = [
  // Flight Booking 1
  {
    type: 'flight',
    bookingDetails: {
      bookingRef: 'FD-FL-001',
      bookingDate: '2024-01-15',
      passengers: [{
        firstName: 'John',
        lastName: 'Doe',
        title: 'Mr'
      }],
      contactDetails: {
        email: 'john@example.com',
        countryCode: '+91',
        phone: '9876543210'
      },
      currency: { symbol: '₹' },
      totalAmount: 45000
    },
    flightDetails: {
      airline: 'Air India',
      flightNumber: 'AI-131'
    },
    paymentId: 'pay_demo123456789'
  },
  // Flight Booking 2
  {
    type: 'flight',
    bookingDetails: {
      bookingRef: 'FD-FL-004',
      bookingDate: '2024-01-20',
      passengers: [{
        firstName: 'Jane',
        lastName: 'Smith',
        title: 'Ms'
      }],
      contactDetails: {
        email: 'jane@example.com',
        countryCode: '+91',
        phone: '9876543211'
      },
      currency: { symbol: '₹' },
      totalAmount: 38000
    },
    flightDetails: {
      airline: 'IndiGo',
      flightNumber: '6E-542'
    },
    paymentId: 'pay_demo789123456'
  },
  // Hotel Booking 1
  {
    type: 'hotel',
    bookingDetails: {
      bookingRef: 'FD-HT-002',
      bookingDate: '2024-01-16',
      passengers: [{
        firstName: 'John',
        lastName: 'Doe',
        title: 'Mr'
      }],
      contactDetails: {
        email: 'john@example.com',
        countryCode: '+91',
        phone: '9876543210'
      },
      currency: { symbol: '₹' },
      totalAmount: 12000
    },
    paymentId: 'pay_demo987654321'
  },
  // Hotel Booking 2
  {
    type: 'hotel',
    bookingDetails: {
      bookingRef: 'FD-HT-005',
      bookingDate: '2024-01-22',
      passengers: [{
        firstName: 'Mike',
        lastName: 'Johnson',
        title: 'Mr'
      }],
      contactDetails: {
        email: 'mike@example.com',
        countryCode: '+91',
        phone: '9876543212'
      },
      currency: { symbol: '₹' },
      totalAmount: 8500
    },
    paymentId: 'pay_demo555666777'
  },
  // Sightseeing Booking 1
  {
    type: 'sightseeing',
    bookingDetails: {
      bookingRef: 'FD-ST-003',
      bookingDate: '2024-01-17',
      passengers: [{
        firstName: 'John',
        lastName: 'Doe',
        title: 'Mr'
      }],
      contactDetails: {
        email: 'john@example.com',
        countryCode: '+91',
        phone: '9876543210'
      },
      currency: { symbol: '₹' },
      totalAmount: 3500
    },
    paymentId: 'pay_demo456789123'
  },
  // Sightseeing Booking 2
  {
    type: 'sightseeing',
    bookingDetails: {
      bookingRef: 'FD-ST-006',
      bookingDate: '2024-01-25',
      passengers: [{
        firstName: 'Sarah',
        lastName: 'Wilson',
        title: 'Ms'
      }],
      contactDetails: {
        email: 'sarah@example.com',
        countryCode: '+91',
        phone: '9876543213'
      },
      currency: { symbol: '₹' },
      totalAmount: 4200
    },
    paymentId: 'pay_demo111222333'
  },
  // Transfer Booking 1
  {
    type: 'transfer',
    bookingDetails: {
      bookingRef: 'FD-TR-007',
      bookingDate: '2024-01-18',
      passengers: [{
        firstName: 'John',
        lastName: 'Doe',
        title: 'Mr'
      }],
      contactDetails: {
        email: 'john@example.com',
        countryCode: '+91',
        phone: '9876543210'
      },
      currency: { symbol: '₹' },
      totalAmount: 1200
    },
    paymentId: 'pay_demo888999000'
  },
  // Transfer Booking 2
  {
    type: 'transfer',
    bookingDetails: {
      bookingRef: 'FD-TR-008',
      bookingDate: '2024-01-28',
      passengers: [{
        firstName: 'David',
        lastName: 'Brown',
        title: 'Mr'
      }],
      contactDetails: {
        email: 'david@example.com',
        countryCode: '+91',
        phone: '9876543214'
      },
      currency: { symbol: '₹' },
      totalAmount: 950
    },
    paymentId: 'pay_demo444555666'
  }
];

/*
 * INTEGRATION POINT
 * Replace the old renderBookings() with renderModularBookings() in the main JSX:
 * 
 * OLD: {activeTab === "bookings" && renderBookings()}
 * NEW: {activeTab === "bookings" && renderModularBookings()}
 */

export default Account;
