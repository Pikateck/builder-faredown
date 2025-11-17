#!/usr/bin/env node

console.log(
  "================================================================================",
);
console.log("ENVIRONMENT VARIABLE CHECK");
console.log(
  "================================================================================\n",
);

const vars = [
  "TBO_HOTEL_SEARCH_URL",
  "TBO_HOTEL_SEARCH_PREBOOK",
  "TBO_HOTEL_STATIC_DATA",
  "TBO_HOTEL_CLIENT_ID",
  "TBO_HOTEL_USER_ID",
  "USE_SUPPLIER_PROXY",
];

vars.forEach((varName) => {
  const value = process.env[varName];
  console.log(`${varName}:`);
  if (value) {
    console.log(
      `  ✅ SET: ${value.substring(0, 80)}${value.length > 80 ? "..." : ""}`,
    );
  } else {
    console.log(`  ❌ NOT SET`);
  }
});

console.log(
  "\n================================================================================",
);
console.log(
  "KEY INSIGHT: If TBO_HOTEL_SEARCH_URL is not set, it will use the fallback",
);
console.log("from the code (api/tbo/search.js)");
console.log(
  "================================================================================\n",
);
