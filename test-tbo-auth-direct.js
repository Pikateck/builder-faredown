/**
 * Test TBO Authentication Endpoint
 * This script tests if our TBO credentials work with the configured endpoints
 */

const axios = require('axios');

async function testTBOAuth() {
  console.log('\n🔍 Testing TBO Authentication...\n');
  
  const authEndpoint = process.env.TBO_HOTEL_BASE_URL_AUTHENTICATION || 
    'https://api.travelboutiqueonline.com/SharedAPI/SharedData.svc';
  
  const authRequest = {
    ClientId: process.env.TBO_HOTEL_CLIENT_ID || 'tboprod',
    UserName: process.env.TBO_HOTEL_USER_ID || 'BOMF145',
    Password: process.env.TBO_HOTEL_PASSWORD || '@Bo#4M-Api@',
    EndUserIp: process.env.TBO_END_USER_IP || '192.168.5.56'
  };
  
  console.log('📤 Request Details:');
  console.log('  Endpoint:', authEndpoint + '/rest/Authenticate');
  console.log('  ClientId:', authRequest.ClientId);
  console.log('  UserName:', authRequest.UserName);
  console.log('  Password:', authRequest.Password ? '***' : 'null');
  console.log('  EndUserIp:', authRequest.EndUserIp);
  console.log('');
  
  try {
    const response = await axios.post(
      authEndpoint + '/rest/Authenticate',
      authRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );
    
    console.log('✅ Authentication Response:');
    console.log('  HTTP Status:', response.status);
    console.log('  Status Code:', response.data?.Status);
    console.log('  TokenId:', response.data?.TokenId ? '✅ PRESENT (length: ' + response.data.TokenId.length + ')' : '❌ MISSING');
    console.log('  Member ID:', response.data?.Member?.MemberId);
    console.log('  Agency ID:', response.data?.Member?.AgencyId);
    console.log('  Error Code:', response.data?.Error?.ErrorCode);
    console.log('  Error Message:', response.data?.Error?.ErrorMessage);
    console.log('');
    console.log('📄 Full Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data?.Status === 1 || response.data?.Status?.Code === 1) {
      console.log('\n✅ SUCCESS: Authentication worked!');
      return response.data.TokenId;
    } else {
      console.log('\n❌ FAILED: Authentication returned non-success status');
      console.log('Status:', response.data?.Status);
      console.log('Error:', response.data?.Error);
      return null;
    }
    
  } catch (error) {
    console.log('❌ Authentication Error:');
    console.log('  Message:', error.message);
    console.log('  HTTP Status:', error.response?.status);
    console.log('  Status Text:', error.response?.statusText);
    console.log('  Response Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('  Request URL:', error.config?.url);
    console.log('');
    
    if (error.response?.status === 404) {
      console.log('⚠️  404 ERROR: Endpoint not found!');
      console.log('⚠️  This suggests the URL is incorrect.');
      console.log('');
      console.log('💡 Trying alternative Tek Travels endpoint...');
      
      try {
        const tekTravelsEndpoint = 'http://api.tektravels.com/SharedServices/SharedData.svc';
        const response2 = await axios.post(
          tekTravelsEndpoint + '/rest/Authenticate',
          authRequest,
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 15000
          }
        );
        
        console.log('✅ Tek Travels endpoint works!');
        console.log('  Status:', response2.data?.Status);
        console.log('  TokenId:', response2.data?.TokenId ? 'PRESENT' : 'MISSING');
        console.log('');
        console.log('📄 Full Response:', JSON.stringify(response2.data, null, 2));
        
      } catch (error2) {
        console.log('❌ Tek Travels endpoint also failed:', error2.message);
      }
    }
    
    return null;
  }
}

async function testHotelSearch(tokenId) {
  if (!tokenId) {
    console.log('\n⚠️  Skipping hotel search test (no TokenId)');
    return;
  }
  
  console.log('\n🔍 Testing TBO Hotel Search...\n');
  
  const searchEndpoint = process.env.TBO_HOTEL_SEARCH_PREBOOK || 
    'https://affiliate.travelboutiqueonline.com/HotelAPI/';
  
  const searchRequest = {
    EndUserIp: process.env.TBO_END_USER_IP || '192.168.5.56',
    TokenId: tokenId,
    CheckInDate: '15/12/2025',
    NoOfNights: 3,
    CountryCode: 'AE',
    CityId: 130443, // Dubai
    PreferredCurrency: 'INR',
    GuestNationality: 'IN',
    NoOfRooms: 1,
    RoomGuests: [
      {
        NoOfAdults: 2,
        NoOfChild: 0,
        ChildAge: []
      }
    ]
  };
  
  console.log('📤 Search Request:');
  console.log('  Endpoint:', searchEndpoint + 'Search');
  console.log('  TokenId:', tokenId.substring(0, 20) + '...');
  console.log('  City: Dubai (130443)');
  console.log('  Check-in: 15/12/2025');
  console.log('  Nights: 3');
  console.log('');
  
  try {
    const response = await axios.post(
      searchEndpoint + 'Search',
      searchRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('✅ Search Response:');
    console.log('  HTTP Status:', response.status);
    console.log('  Response Status:', response.data?.ResponseStatus || response.data?.Status);
    console.log('  Hotel Count:', response.data?.HotelResults?.length || 0);
    console.log('  TraceId:', response.data?.TraceId ? 'PRESENT' : 'MISSING');
    console.log('  Error Code:', response.data?.Error?.ErrorCode);
    console.log('  Error Message:', response.data?.Error?.ErrorMessage);
    console.log('');
    
    if (response.data?.HotelResults?.length > 0) {
      console.log('🏨 Sample Hotel:');
      const hotel = response.data.HotelResults[0];
      console.log('  Hotel Code:', hotel.HotelCode);
      console.log('  Hotel Name:', hotel.HotelName);
      console.log('  Star Rating:', hotel.StarRating);
      console.log('  Price:', hotel.Price?.OfferedPrice, hotel.Price?.CurrencyCode);
    }
    
  } catch (error) {
    console.log('❌ Search Error:');
    console.log('  Message:', error.message);
    console.log('  HTTP Status:', error.response?.status);
    console.log('  Response:', JSON.stringify(error.response?.data, null, 2));
  }
}

// Run tests
(async () => {
  try {
    const tokenId = await testTBOAuth();
    await testHotelSearch(tokenId);
    
    console.log('\n' + '='.repeat(60));
    console.log('Test Complete!');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
})();
