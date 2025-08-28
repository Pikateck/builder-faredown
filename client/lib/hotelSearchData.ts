export interface SearchResult {
  id: string;
  type: 'hotel' | 'city' | 'area' | 'landmark' | 'airport';
  name: string;
  description: string;
  location: string;
  code?: string;
  rating?: number;
  image?: string;
}

export const hotelSearchData: SearchResult[] = [
  // Hotels
  {
    id: 'grand-hyatt-dubai',
    type: 'hotel',
    name: 'Grand Hyatt Dubai',
    description: '5-star luxury hotel',
    location: 'Dubai, United Arab Emirates',
    code: 'DXB',
    rating: 4.5,
  },
  {
    id: 'burj-al-arab',
    type: 'hotel',
    name: 'Burj Al Arab Jumeirah',
    description: '7-star iconic sail-shaped hotel',
    location: 'Dubai, United Arab Emirates',
    code: 'DXB',
    rating: 4.8,
  },
  {
    id: 'atlantis-palm',
    type: 'hotel',
    name: 'Atlantis The Palm',
    description: 'Luxury resort on Palm Jumeirah',
    location: 'Dubai, United Arab Emirates',
    code: 'DXB',
    rating: 4.6,
  },
  {
    id: 'armani-hotel-dubai',
    type: 'hotel',
    name: 'Armani Hotel Dubai',
    description: 'Designer hotel in Burj Khalifa',
    location: 'Dubai, United Arab Emirates',
    code: 'DXB',
    rating: 4.7,
  },
  {
    id: 'taj-mumbai',
    type: 'hotel',
    name: 'The Taj Mahal Palace Mumbai',
    description: 'Iconic heritage luxury hotel',
    location: 'Mumbai, India',
    code: 'BOM',
    rating: 4.4,
  },
  {
    id: 'oberoi-mumbai',
    type: 'hotel',
    name: 'The Oberoi Mumbai',
    description: 'Luxury business hotel',
    location: 'Mumbai, India',
    code: 'BOM',
    rating: 4.6,
  },
  {
    id: 'ritz-carlton-tokyo',
    type: 'hotel',
    name: 'The Ritz-Carlton Tokyo',
    description: 'Luxury hotel in Midtown',
    location: 'Tokyo, Japan',
    code: 'NRT',
    rating: 4.7,
  },
  {
    id: 'park-hyatt-tokyo',
    type: 'hotel',
    name: 'Park Hyatt Tokyo',
    description: 'Luxury hotel in Shinjuku',
    location: 'Tokyo, Japan',
    code: 'NRT',
    rating: 4.6,
  },
  {
    id: 'shangri-la-london',
    type: 'hotel',
    name: 'Shangri La Hotel At The Shard',
    description: 'Luxury hotel in iconic skyscraper',
    location: 'London, United Kingdom',
    code: 'LHR',
    rating: 4.5,
  },
  {
    id: 'savoy-london',
    type: 'hotel',
    name: 'The Savoy',
    description: 'Historic luxury hotel in Covent Garden',
    location: 'London, United Kingdom',
    code: 'LHR',
    rating: 4.4,
  },

  // Cities
  {
    id: 'dubai-city',
    type: 'city',
    name: 'Dubai',
    description: 'United Arab Emirates',
    location: 'Dubai, United Arab Emirates',
    code: 'DXB',
  },
  {
    id: 'mumbai-city',
    type: 'city',
    name: 'Mumbai',
    description: 'Maharashtra, India',
    location: 'Mumbai, India',
    code: 'BOM',
  },
  {
    id: 'delhi-city',
    type: 'city',
    name: 'Delhi',
    description: 'Delhi, India',
    location: 'Delhi, India',
    code: 'DEL',
  },
  {
    id: 'london-city',
    type: 'city',
    name: 'London',
    description: 'United Kingdom',
    location: 'London, United Kingdom',
    code: 'LHR',
  },
  {
    id: 'paris-city',
    type: 'city',
    name: 'Paris',
    description: 'France',
    location: 'Paris, France',
    code: 'CDG',
  },
  {
    id: 'tokyo-city',
    type: 'city',
    name: 'Tokyo',
    description: 'Japan',
    location: 'Tokyo, Japan',
    code: 'NRT',
  },
  {
    id: 'singapore-city',
    type: 'city',
    name: 'Singapore',
    description: 'Singapore',
    location: 'Singapore',
    code: 'SIN',
  },
  {
    id: 'new-york-city',
    type: 'city',
    name: 'New York',
    description: 'New York, United States',
    location: 'New York, United States',
    code: 'JFK',
  },
  {
    id: 'bangkok-city',
    type: 'city',
    name: 'Bangkok',
    description: 'Thailand',
    location: 'Bangkok, Thailand',
    code: 'BKK',
  },

  // Areas/Districts
  {
    id: 'downtown-dubai',
    type: 'area',
    name: 'Downtown Dubai',
    description: 'Central business district',
    location: 'Dubai, United Arab Emirates',
    code: 'DXB',
  },
  {
    id: 'dubai-marina',
    type: 'area',
    name: 'Dubai Marina',
    description: 'Waterfront district',
    location: 'Dubai, United Arab Emirates',
    code: 'DXB',
  },
  {
    id: 'jumeirah-beach',
    type: 'area',
    name: 'Jumeirah Beach',
    description: 'Beachfront area',
    location: 'Dubai, United Arab Emirates',
    code: 'DXB',
  },
  {
    id: 'bandra-mumbai',
    type: 'area',
    name: 'Bandra',
    description: 'Trendy suburb',
    location: 'Mumbai, India',
    code: 'BOM',
  },
  {
    id: 'south-mumbai',
    type: 'area',
    name: 'South Mumbai',
    description: 'Historic city center',
    location: 'Mumbai, India',
    code: 'BOM',
  },
  {
    id: 'connaught-place',
    type: 'area',
    name: 'Connaught Place',
    description: 'Central business district',
    location: 'Delhi, India',
    code: 'DEL',
  },
  {
    id: 'covent-garden',
    type: 'area',
    name: 'Covent Garden',
    description: 'West End district',
    location: 'London, United Kingdom',
    code: 'LHR',
  },
  {
    id: 'west-end-london',
    type: 'area',
    name: 'West End',
    description: 'Theatre and shopping district',
    location: 'London, United Kingdom',
    code: 'LHR',
  },
  {
    id: 'shibuya-tokyo',
    type: 'area',
    name: 'Shibuya',
    description: 'Entertainment district',
    location: 'Tokyo, Japan',
    code: 'NRT',
  },
  {
    id: 'ginza-tokyo',
    type: 'area',
    name: 'Ginza',
    description: 'Upscale shopping district',
    location: 'Tokyo, Japan',
    code: 'NRT',
  },

  // Landmarks
  {
    id: 'burj-khalifa',
    type: 'landmark',
    name: 'Burj Khalifa',
    description: "World's tallest building",
    location: 'Dubai, United Arab Emirates',
    code: 'DXB',
  },
  {
    id: 'dubai-mall',
    type: 'landmark',
    name: 'Dubai Mall',
    description: 'Largest shopping mall',
    location: 'Dubai, United Arab Emirates',
    code: 'DXB',
  },
  {
    id: 'palm-jumeirah',
    type: 'landmark',
    name: 'Palm Jumeirah',
    description: 'Artificial palm-shaped island',
    location: 'Dubai, United Arab Emirates',
    code: 'DXB',
  },
  {
    id: 'gateway-of-india',
    type: 'landmark',
    name: 'Gateway of India',
    description: 'Historic monument',
    location: 'Mumbai, India',
    code: 'BOM',
  },
  {
    id: 'marine-drive',
    type: 'landmark',
    name: 'Marine Drive',
    description: 'Coastal promenade',
    location: 'Mumbai, India',
    code: 'BOM',
  },
  {
    id: 'india-gate',
    type: 'landmark',
    name: 'India Gate',
    description: 'War memorial',
    location: 'Delhi, India',
    code: 'DEL',
  },
  {
    id: 'big-ben',
    type: 'landmark',
    name: 'Big Ben',
    description: 'Iconic clock tower',
    location: 'London, United Kingdom',
    code: 'LHR',
  },
  {
    id: 'tower-bridge',
    type: 'landmark',
    name: 'Tower Bridge',
    description: 'Historic bascule bridge',
    location: 'London, United Kingdom',
    code: 'LHR',
  },
  {
    id: 'eiffel-tower',
    type: 'landmark',
    name: 'Eiffel Tower',
    description: 'Iconic iron tower',
    location: 'Paris, France',
    code: 'CDG',
  },
  {
    id: 'tokyo-tower',
    type: 'landmark',
    name: 'Tokyo Tower',
    description: 'Communications tower',
    location: 'Tokyo, Japan',
    code: 'NRT',
  },

  // Airports
  {
    id: 'dubai-airport',
    type: 'airport',
    name: 'Dubai International Airport',
    description: 'DXB Airport',
    location: 'Dubai, United Arab Emirates',
    code: 'DXB',
  },
  {
    id: 'mumbai-airport',
    type: 'airport',
    name: 'Chhatrapati Shivaji International Airport',
    description: 'BOM Airport',
    location: 'Mumbai, India',
    code: 'BOM',
  },
  {
    id: 'delhi-airport',
    type: 'airport',
    name: 'Indira Gandhi International Airport',
    description: 'DEL Airport',
    location: 'Delhi, India',
    code: 'DEL',
  },
  {
    id: 'heathrow-airport',
    type: 'airport',
    name: 'Heathrow Airport',
    description: 'LHR Airport',
    location: 'London, United Kingdom',
    code: 'LHR',
  },
  {
    id: 'narita-airport',
    type: 'airport',
    name: 'Narita International Airport',
    description: 'NRT Airport',
    location: 'Tokyo, Japan',
    code: 'NRT',
  },
];

export function searchHotels(query: string, limit: number = 8): SearchResult[] {
  if (!query || query.length < 1) {
    // Return popular destinations when no query
    return hotelSearchData.filter(item => item.type === 'city').slice(0, limit);
  }

  const lowerQuery = query.toLowerCase().trim();
  
  // Search across all fields and rank results
  const results = hotelSearchData
    .map(item => {
      let score = 0;
      
      // Exact name match gets highest score
      if (item.name.toLowerCase() === lowerQuery) {
        score += 100;
      }
      // Name starts with query
      else if (item.name.toLowerCase().startsWith(lowerQuery)) {
        score += 50;
      }
      // Name contains query
      else if (item.name.toLowerCase().includes(lowerQuery)) {
        score += 30;
      }
      
      // Location matches
      if (item.location.toLowerCase().includes(lowerQuery)) {
        score += 20;
      }
      
      // Description matches
      if (item.description.toLowerCase().includes(lowerQuery)) {
        score += 10;
      }
      
      // Code matches
      if (item.code?.toLowerCase().includes(lowerQuery)) {
        score += 15;
      }
      
      // Boost score based on type priority
      switch (item.type) {
        case 'hotel':
          score += 5;
          break;
        case 'city':
          score += 4;
          break;
        case 'area':
          score += 3;
          break;
        case 'landmark':
          score += 2;
          break;
        case 'airport':
          score += 1;
          break;
      }
      
      return { ...item, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
    
  return results;
}

export function getTypeIcon(type: string): string {
  switch (type) {
    case 'hotel':
      return '🏨';
    case 'city':
      return '🏙️';
    case 'area':
      return '📍';
    case 'landmark':
      return '🏛️';
    case 'airport':
      return '✈️';
    default:
      return '📍';
  }
}

export function getTypeLabel(type: string): string {
  switch (type) {
    case 'hotel':
      return 'Hotel';
    case 'city':
      return 'City';
    case 'area':
      return 'Area';
    case 'landmark':
      return 'Landmark';
    case 'airport':
      return 'Airport';
    default:
      return 'Location';
  }
}
