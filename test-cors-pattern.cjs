// Test if the fly.dev URL matches the CORS regex
const flyDevUrl = "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev";
const corsPattern = /^https:\/\/([a-z0-9-]+\.)*fly\.dev$/i;

console.log("Testing CORS pattern match:");
console.log("URL:", flyDevUrl);
console.log("Pattern:", corsPattern);
console.log("Matches:", corsPattern.test(flyDevUrl));

// Test variations
const testUrls = [
  "https://55e69d5755db4519a9295a29a1a55930-aaf2790235d34f3ab48afa56a.fly.dev",
  "https://test.fly.dev",
  "https://a.b.fly.dev",
  "https://abc-123.fly.dev"
];

console.log("\nTest Results:");
testUrls.forEach(url => {
  console.log(`${url}: ${corsPattern.test(url) ? '✓ ALLOWED' : '✗ BLOCKED'}`);
});
