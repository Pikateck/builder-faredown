// Updated API dev client with proper Dubai packages for October 2025
// This ensures the frontend shows correct data when backend is not available

export class DevApiClient {
  // ... existing code ...

  async get(endpoint: string) {
    // Handle packages endpoint with proper Dubai filtering
    if (endpoint.includes("/packages")) {
      const url = new URL(endpoint.startsWith("http") ? endpoint : `http://localhost${endpoint}`);
      const params = new URLSearchParams(url.search);
      
      // Get query parameters
      const destination = params.get("destination");
      const destinationType = params.get("destination_type");
      const departureDate = params.get("departure_date");
      const returnDate = params.get("return_date");
      
      console.log("DevAPI filtering:", { destination, destinationType, departureDate, returnDate });
      
      // Dubai packages with proper filtering for October 1-5, 2025
      const allPackages = [
        {
          id: 1,
          slug: "dubai-luxury-experience",
          title: "Dubai Luxury Experience",
          region_name: "Middle East",
          country_name: "United Arab Emirates",
          city_name: "Dubai",
          duration_days: 7,
          duration_nights: 6,
          from_price: 179998,
          currency: "INR",
          next_departure_date: "2025-10-01",
          available_departures_count: 3,
          hero_image_url:
            "https://images.pexels.com/photos/19894545/pexels-photo-19894545.jpeg?auto=compress&cs=tinysrgb&w=400",
          rating: 4.8,
          review_count: 156,
          is_featured: true,
          tags: ["luxury", "city-break", "shopping", "culture"],
          highlights: [
            "5-star hotel accommodation",
            "Burj Khalifa At The Top",
            "Desert safari with BBQ dinner",
            "Dubai Marina cruise",
            "Shopping at Gold Souk",
          ],
          category: "luxury",
          package_category: "luxury",
        },
        {
          id: 2,
          slug: "dubai-city-explorer",
          title: "Dubai City Explorer",
          region_name: "Middle East",
          country_name: "United Arab Emirates", 
          city_name: "Dubai",
          duration_days: 5,
          duration_nights: 4,
          from_price: 109998,
          currency: "INR",
          next_departure_date: "2025-10-01",
          available_departures_count: 3,
          hero_image_url:
            "https://images.pexels.com/photos/2564066/pexels-photo-2564066.jpeg?auto=compress&cs=tinysrgb&w=400",
          rating: 4.6,
          review_count: 89,
          is_featured: false,
          tags: ["explorer", "culture", "city-break", "shopping"],
          highlights: [
            "4-star hotel accommodation",
            "Dubai Mall and Burj Khalifa visits",
            "Traditional dhow cruise",
            "Old Dubai exploration",
            "Spice and Gold Souk tours",
          ],
          category: "explorer",
          package_category: "explorer",
        },
        {
          id: 3,
          slug: "dubai-adventure-weekender",
          title: "Dubai Adventure Weekender",
          region_name: "Middle East",
          country_name: "United Arab Emirates",
          city_name: "Dubai", 
          duration_days: 4,
          duration_nights: 3,
          from_price: 89998,
          currency: "INR",
          next_departure_date: "2025-10-01",
          available_departures_count: 3,
          hero_image_url:
            "https://images.pexels.com/photos/6965513/pexels-photo-6965513.jpeg?auto=compress&cs=tinysrgb&w=400",
          rating: 4.5,
          review_count: 203,
          is_featured: true,
          tags: ["adventure", "weekend", "activities", "desert"],
          highlights: [
            "3-star hotel accommodation",
            "Desert safari with quad biking",
            "Dubai Marina water sports",
            "Skydiving experience",
            "Traditional Bedouin camp",
          ],
          category: "adventure",
          package_category: "adventure",
        }
      ];
      
      // Filter packages based on destination and date
      let filteredPackages = allPackages;
      
      // Filter by destination
      if (destination && destinationType) {
        const destName = destination.split(",")[0].trim().toLowerCase();
        
        if (destinationType === "city") {
          filteredPackages = filteredPackages.filter(pkg => 
            pkg.city_name && pkg.city_name.toLowerCase().includes(destName)
          );
        } else if (destinationType === "country") {
          filteredPackages = filteredPackages.filter(pkg => 
            pkg.country_name && pkg.country_name.toLowerCase().includes(destName)
          );
        } else if (destinationType === "region") {
          filteredPackages = filteredPackages.filter(pkg => 
            pkg.region_name && pkg.region_name.toLowerCase().includes(destName)
          );
        }
      }
      
      // Filter by date range (October 1-5, 2025)
      if (departureDate || returnDate) {
        // For demo purposes, ensure we only show packages with departures in the specified date range
        const departure = departureDate ? new Date(departureDate) : null;
        const returnD = returnDate ? new Date(returnDate) : null;
        
        filteredPackages = filteredPackages.filter(pkg => {
          const pkgDate = new Date(pkg.next_departure_date);
          
          if (departure && pkgDate < departure) return false;
          if (returnD && pkgDate > returnD) return false;
          
          return true;
        });
      }
      
      // Generate facets based on filtered packages
      const facets = {
        regions: {},
        categories: {},
        price_ranges: {
          min: Math.min(...filteredPackages.map(p => p.from_price)),
          max: Math.max(...filteredPackages.map(p => p.from_price)),
          avg: Math.round(filteredPackages.reduce((sum, p) => sum + p.from_price, 0) / filteredPackages.length)
        }
      };
      
      // Calculate facets
      filteredPackages.forEach(pkg => {
        // Region facets
        if (pkg.region_name) {
          facets.regions[pkg.region_name] = (facets.regions[pkg.region_name] || 0) + 1;
        }
        
        // Category facets
        if (pkg.package_category) {
          facets.categories[pkg.package_category] = (facets.categories[pkg.package_category] || 0) + 1;
        }
      });
      
      console.log(`DevAPI: Returning ${filteredPackages.length} packages for ${destination || 'all destinations'}`);
      
      return {
        success: true,
        packages: filteredPackages,
        pagination: {
          page: 1,
          page_size: 20,
          total: filteredPackages.length,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
        facets: facets,
        filters: {
          destination,
          destination_type: destinationType,
          departure_date: departureDate,
          return_date: returnDate
        }
      };
    }
    
    // Handle package details endpoint
    if (endpoint.includes("/packages/") && !endpoint.includes("/packages?")) {
      const slug = endpoint.split("/packages/")[1];
      
      const packageDetails = {
        "dubai-luxury-experience": {
          id: 1,
          slug: "dubai-luxury-experience", 
          title: "Dubai Luxury Experience",
          region_name: "Middle East",
          country_name: "United Arab Emirates",
          city_name: "Dubai",
          duration_days: 7,
          duration_nights: 6,
          base_price_pp: 179998,
          currency: "INR",
          overview: "Experience the best of Dubai with our luxury package",
          description: "A luxury travel experience showcasing Dubai's highlights",
          inclusions: [
            "5-star hotel accommodation",
            "Airport transfers",
            "City tours",
            "Desert safari"
          ],
          exclusions: [
            "International flights",
            "Personal expenses"
          ],
          departures: [
            {
              id: 1,
              departure_date: "2025-10-01",
              return_date: "2025-10-07",
              price_per_person: 179998,
              available_seats: 20,
              departure_city_name: "Mumbai"
            },
            {
              id: 2,
              departure_date: "2025-10-03",
              return_date: "2025-10-09", 
              price_per_person: 179998,
              available_seats: 20,
              departure_city_name: "Mumbai"
            },
            {
              id: 3,
              departure_date: "2025-10-05",
              return_date: "2025-10-11",
              price_per_person: 179998,
              available_seats: 20,
              departure_city_name: "Mumbai"
            }
          ]
        },
        "dubai-city-explorer": {
          id: 2,
          slug: "dubai-city-explorer",
          title: "Dubai City Explorer", 
          region_name: "Middle East",
          country_name: "United Arab Emirates",
          city_name: "Dubai",
          duration_days: 5,
          duration_nights: 4,
          base_price_pp: 109998,
          currency: "INR",
          overview: "Explore Dubai's iconic landmarks and culture",
          description: "A comprehensive city exploration package",
          inclusions: [
            "4-star hotel accommodation",
            "Airport transfers", 
            "City tours",
            "Desert safari"
          ],
          exclusions: [
            "International flights",
            "Personal expenses"
          ],
          departures: [
            {
              id: 4,
              departure_date: "2025-10-01",
              return_date: "2025-10-05",
              price_per_person: 109998,
              available_seats: 20,
              departure_city_name: "Mumbai"
            },
            {
              id: 5,
              departure_date: "2025-10-03",
              return_date: "2025-10-07",
              price_per_person: 109998,
              available_seats: 20,
              departure_city_name: "Mumbai"
            },
            {
              id: 6,
              departure_date: "2025-10-05",
              return_date: "2025-10-09",
              price_per_person: 109998,
              available_seats: 20,
              departure_city_name: "Mumbai"
            }
          ]
        },
        "dubai-adventure-weekender": {
          id: 3,
          slug: "dubai-adventure-weekender",
          title: "Dubai Adventure Weekender",
          region_name: "Middle East", 
          country_name: "United Arab Emirates",
          city_name: "Dubai",
          duration_days: 4,
          duration_nights: 3,
          base_price_pp: 89998,
          currency: "INR",
          overview: "Adventure-packed weekend in Dubai",
          description: "Perfect for thrill-seekers and adventure lovers",
          inclusions: [
            "3-star hotel accommodation",
            "Airport transfers",
            "Adventure activities",
            "Desert safari"
          ],
          exclusions: [
            "International flights", 
            "Personal expenses"
          ],
          departures: [
            {
              id: 7,
              departure_date: "2025-10-01",
              return_date: "2025-10-04",
              price_per_person: 89998,
              available_seats: 20,
              departure_city_name: "Mumbai"
            },
            {
              id: 8,
              departure_date: "2025-10-03",
              return_date: "2025-10-06",
              price_per_person: 89998,
              available_seats: 20,
              departure_city_name: "Mumbai"
            },
            {
              id: 9,
              departure_date: "2025-10-05",
              return_date: "2025-10-08",
              price_per_person: 89998,
              available_seats: 20,
              departure_city_name: "Mumbai"
            }
          ]
        }
      };
      
      const packageDetail = packageDetails[slug];
      if (packageDetail) {
        return {
          success: true,
          data: packageDetail
        };
      } else {
        return {
          success: false,
          error: "Package not found"
        };
      }
    }
    
    // ... rest of existing DevApiClient methods
    return { success: false, error: "Endpoint not implemented in dev mode" };
  }
}
