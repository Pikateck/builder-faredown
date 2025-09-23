/**
 * Account Service - API endpoints for account overview, bookings, and travel activity
 * Implements the API structure provided by the user
 */

import { formatAppDate } from "@/utils/dateUtils";

// Types matching the user's API specification
export interface AccountOverview {
  user_id: string;
  full_name: string;
  member_since: string;
  loyalty_tier: string;
  loyalty_points: number;
  progress_to_next_tier: {
    current_bookings: number;
    required_bookings: number;
    remaining: number;
  };
  total_bookings: number;
  countries_visited: number;
  recent_activity: Array<{
    booking_ref: string;
    module: string;
    date: string;
    amount: number;
    status: string;
  }>;
}

export interface TravelActivity {
  booking_ref: string;
  module: string;
  title: string;
  date: string;
  amount: number;
  status: string;
}

export interface BookingListItem {
  booking_ref: string;
  module: string;
  title: string;
  date: string;
  amount: number;
  status: string;
  payment_id: string;
}

export interface FlightBookingDetail {
  booking_ref: string;
  module: "flight";
  status: string;
  booked_on: string;
  total_paid: number;
  payment_id: string;
  flight_details: {
    from_iata: string;
    to_iata: string;
    dep_at: string;
    arr_at: string;
    carrier: string;
    flight_no: string;
  };
  passengers: Array<{
    name: string;
    title: string;
    type: string;
    email: string;
    phone: string;
  }>;
  ticket: {
    ticket_no: string;
    issue_date: string;
    eticket_pdf_url: string;
  };
  invoice: {
    invoice_no: string;
    issued_at: string;
    amount: number;
    currency: string;
    pdf_url: string;
  };
}

export interface HotelBookingDetail {
  booking_ref: string;
  module: "hotel";
  status: string;
  booked_on: string;
  total_paid: number;
  payment_id: string;
  hotel_details: {
    hotel_name: string;
    city: string;
    checkin_at: string;
    checkout_at: string;
    guests_adults: number;
    guests_children: number;
  };
  guests: Array<{
    name: string;
    title: string;
    type: string;
    email: string;
    phone: string;
  }>;
  voucher: {
    voucher_no: string;
    issue_date: string;
    voucher_pdf_url: string;
  };
  invoice: {
    invoice_no: string;
    issued_at: string;
    amount: number;
    currency: string;
    pdf_url: string;
  };
}

export type BookingDetail = FlightBookingDetail | HotelBookingDetail;

class AccountService {
  private baseUrl = "/api/account";
  private bookingsUrl = "/api/bookings";

  // Mock data for development - replace with real API calls
  private mockData = {
    overview: {
      user_id: "USR123",
      full_name: "Zubin Aibara",
      member_since: "2024-12-01",
      loyalty_tier: "Gold",
      loyalty_points: 1250,
      progress_to_next_tier: {
        current_bookings: 5,
        required_bookings: 15,
        remaining: 10,
      },
      total_bookings: 2,
      countries_visited: 2,
      recent_activity: [
        {
          booking_ref: "FD-FL-001",
          module: "flight",
          date: "2024-01-15",
          amount: 45000,
          status: "confirmed",
        },
        {
          booking_ref: "FD-HT-002",
          module: "hotel",
          date: "2024-01-16",
          amount: 12000,
          status: "confirmed",
        },
      ],
    },
    travelActivity: [
      {
        booking_ref: "FD-FL-001",
        module: "flight",
        title: "Mumbai → Dubai",
        date: "2024-01-15",
        amount: 45000,
        status: "confirmed",
      },
      {
        booking_ref: "FD-HT-002",
        module: "hotel",
        title: "Dubai Hotel",
        date: "2024-01-16",
        amount: 12000,
        status: "confirmed",
      },
    ],
    bookings: [
      {
        booking_ref: "FD-FL-001",
        module: "flight",
        title: "Mumbai → Dubai",
        date: "2024-01-15",
        amount: 45000,
        status: "confirmed",
        payment_id: "pay_demo12345",
      },
      {
        booking_ref: "FD-HT-002",
        module: "hotel",
        title: "Dubai Hotel",
        date: "2024-01-16",
        amount: 12000,
        status: "confirmed",
        payment_id: "pay_demo98765",
      },
    ],
    flightDetail: {
      booking_ref: "FD-FL-001",
      module: "flight" as const,
      status: "confirmed",
      booked_on: "2024-01-15",
      total_paid: 45000,
      payment_id: "pay_demo12345",
      flight_details: {
        from_iata: "BOM",
        to_iata: "DXB",
        dep_at: "2025-08-03T10:15:00",
        arr_at: "2025-08-03T13:45:00",
        carrier: "Air India",
        flight_no: "AI-131",
      },
      passengers: [
        {
          name: "John Doe",
          title: "Mr",
          type: "Adult",
          email: "john@example.com",
          phone: "+91 9876543210",
        },
      ],
      ticket: {
        ticket_no: "AI131-789456123",
        issue_date: "2024-01-15",
        eticket_pdf_url: "https://cdn.faredown.com/docs/FD-FL-001-ticket.pdf",
      },
      invoice: {
        invoice_no: "INV-FL-001",
        issued_at: "2024-01-15",
        amount: 45000,
        currency: "INR",
        pdf_url: "https://cdn.faredown.com/docs/FD-FL-001-invoice.pdf",
      },
    },
    hotelDetail: {
      booking_ref: "FD-HT-002",
      module: "hotel" as const,
      status: "confirmed",
      booked_on: "2024-01-16",
      total_paid: 12000,
      payment_id: "pay_demo98765",
      hotel_details: {
        hotel_name: "Dubai Hotel",
        city: "Dubai",
        checkin_at: "2025-08-03",
        checkout_at: "2025-08-10",
        guests_adults: 1,
        guests_children: 0,
      },
      guests: [
        {
          name: "John Doe",
          title: "Mr",
          type: "Adult",
          email: "john@example.com",
          phone: "+91 9876543210",
        },
      ],
      voucher: {
        voucher_no: "VCH-HT-002",
        issue_date: "2024-01-16",
        voucher_pdf_url: "https://cdn.faredown.com/docs/FD-HT-002-voucher.pdf",
      },
      invoice: {
        invoice_no: "INV-HT-002",
        issued_at: "2024-01-16",
        amount: 12000,
        currency: "INR",
        pdf_url: "https://cdn.faredown.com/docs/FD-HT-002-invoice.pdf",
      },
    },
  };

  /**
   * Get account overview data
   */
  async getAccountOverview(): Promise<AccountOverview> {
    try {
      const response = await fetch(`${this.baseUrl}/overview`);

      if (!response.ok) {
        console.warn("API endpoint not available, using mock data");
        return this.mockData.overview;
      }

      return await response.json();
    } catch (error) {
      console.warn("Failed to fetch account overview, using mock data:", error);
      return this.mockData.overview;
    }
  }

  /**
   * Get travel activity list
   */
  async getTravelActivity(): Promise<TravelActivity[]> {
    try {
      const response = await fetch(`${this.baseUrl}/travel-activity`);

      if (!response.ok) {
        console.warn("API endpoint not available, using mock data");
        return this.mockData.travelActivity;
      }

      return await response.json();
    } catch (error) {
      console.warn("Failed to fetch travel activity, using mock data:", error);
      return this.mockData.travelActivity;
    }
  }

  /**
   * Get bookings list with optional module filter
   */
  async getBookings(module: string = "all"): Promise<BookingListItem[]> {
    try {
      const url =
        module === "all"
          ? `${this.baseUrl}/bookings`
          : `${this.baseUrl}/bookings?module=${module}`;

      const response = await fetch(url);

      if (!response.ok) {
        console.warn("API endpoint not available, using mock data");
        let bookings = this.mockData.bookings;

        // Filter by module if specified
        if (module !== "all") {
          bookings = bookings.filter((b) => b.module === module);
        }

        return bookings;
      }

      return await response.json();
    } catch (error) {
      console.warn("Failed to fetch bookings, using mock data:", error);
      let bookings = this.mockData.bookings;

      // Filter by module if specified
      if (module !== "all") {
        bookings = bookings.filter((b) => b.module === module);
      }

      return bookings;
    }
  }

  /**
   * Get specific booking details
   */
  async getBookingDetail(bookingRef: string): Promise<BookingDetail | null> {
    try {
      const response = await fetch(`${this.bookingsUrl}/${bookingRef}`);

      if (!response.ok) {
        console.warn("API endpoint not available, using mock data");

        // Return mock data based on booking reference
        if (bookingRef.includes("FL")) {
          return this.mockData.flightDetail;
        } else if (bookingRef.includes("HT")) {
          return this.mockData.hotelDetail;
        }

        return null;
      }

      return await response.json();
    } catch (error) {
      console.warn("Failed to fetch booking detail, using mock data:", error);

      // Return mock data based on booking reference
      if (bookingRef.includes("FL")) {
        return this.mockData.flightDetail;
      } else if (bookingRef.includes("HT")) {
        return this.mockData.hotelDetail;
      }

      return null;
    }
  }

  /**
   * Download ticket/voucher PDF
   */
  async downloadTicket(bookingRef: string): Promise<string> {
    try {
      const response = await fetch(`${this.bookingsUrl}/${bookingRef}/ticket`);

      if (!response.ok) {
        console.warn("API endpoint not available, using mock URL");

        if (bookingRef.includes("FL")) {
          return this.mockData.flightDetail.ticket.eticket_pdf_url;
        } else if (bookingRef.includes("HT")) {
          return this.mockData.hotelDetail.voucher.voucher_pdf_url;
        } else if (bookingRef.includes("SG") || bookingRef.includes("SS")) {
          // Sightseeing booking
          return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        } else if (bookingRef.includes("TR") || bookingRef.includes("TF")) {
          // Transfer booking
          return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        }

        throw new Error("Ticket not found");
      }

      return response.url;
    } catch (error) {
      console.warn("Failed to get ticket download URL:", error);

      if (bookingRef.includes("FL")) {
        return this.mockData.flightDetail.ticket.eticket_pdf_url;
      } else if (bookingRef.includes("HT")) {
        return this.mockData.hotelDetail.voucher.voucher_pdf_url;
      } else if (bookingRef.includes("SG") || bookingRef.includes("SS")) {
        // Sightseeing booking
        return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
      } else if (bookingRef.includes("TR") || bookingRef.includes("TF")) {
        // Transfer booking
        return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
      }

      throw error;
    }
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoice(bookingRef: string): Promise<string> {
    try {
      const response = await fetch(`${this.bookingsUrl}/${bookingRef}/invoice`);

      if (!response.ok) {
        console.warn("API endpoint not available, using mock URL");

        if (bookingRef.includes("FL")) {
          return this.mockData.flightDetail.invoice.pdf_url;
        } else if (bookingRef.includes("HT")) {
          return this.mockData.hotelDetail.invoice.pdf_url;
        } else if (bookingRef.includes("SG") || bookingRef.includes("SS")) {
          // Sightseeing booking
          return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        } else if (bookingRef.includes("TR") || bookingRef.includes("TF")) {
          // Transfer booking
          return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        }

        throw new Error("Invoice not found");
      }

      return response.url;
    } catch (error) {
      console.warn("Failed to get invoice download URL:", error);

      if (bookingRef.includes("FL")) {
        return this.mockData.flightDetail.invoice.pdf_url;
      } else if (bookingRef.includes("HT")) {
        return this.mockData.hotelDetail.invoice.pdf_url;
      } else if (bookingRef.includes("SG") || bookingRef.includes("SS")) {
        // Sightseeing booking
        return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
      } else if (bookingRef.includes("TR") || bookingRef.includes("TF")) {
        // Transfer booking
        return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
      }

      throw error;
    }
  }

  /**
   * Utility function to format booking data for display
   */
  formatBookingForDisplay(booking: BookingDetail) {
    return {
      ...booking,
      booked_on_formatted: formatAppDate(booking.booked_on),
      // Add specific formatting based on module type
      ...(booking.module === "flight" && {
        flight_details: {
          ...booking.flight_details,
          dep_at_formatted: formatAppDate(booking.flight_details.dep_at),
          arr_at_formatted: formatAppDate(booking.flight_details.arr_at),
        },
      }),
      ...(booking.module === "hotel" && {
        hotel_details: {
          ...booking.hotel_details,
          checkin_at_formatted: formatAppDate(booking.hotel_details.checkin_at),
          checkout_at_formatted: formatAppDate(
            booking.hotel_details.checkout_at,
          ),
        },
      }),
    };
  }
}

// Export singleton instance
export const accountService = new AccountService();
