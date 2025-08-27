// PNG Verification Script
// Run this in browser console to verify PNG format

function verifyPNGFormat() {
  console.log('🔍 Verifying logo file format...');
  
  fetch('/logo/faredown-logo.png?v=2')
    .then(response => {
      console.log('📊 Network Response:');
      console.log('Status:', response.status);
      console.log('Content-Type:', response.headers.get('content-type'));
      
      if (response.status !== 200) {
        console.error('❌ File not found or error loading');
        return;
      }
      
      return response.arrayBuffer();
    })
    .then(buffer => {
      if (buffer) {
        const bytes = [...new Uint8Array(buffer).slice(0, 8)];
        console.log('🔢 File signature bytes:', bytes);
        
        // PNG signature: [137,80,78,71,13,10,26,10]
        const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
        const isPNG = bytes.every((byte, index) => byte === pngSignature[index]);
        
        if (isPNG) {
          console.log('✅ VERIFIED: File is a valid PNG format');
        } else {
          console.log('❌ INVALID: File is not PNG format');
          console.log('Expected PNG signature:', pngSignature);
          console.log('Actual bytes:', bytes);
        }
        
        console.log('📏 File size:', buffer.byteLength, 'bytes');
      }
    })
    .catch(error => {
      console.error('❌ Error verifying file:', error);
    });
}

// Auto-run verification
verifyPNGFormat();

// Make function available globally
window.verifyPNGFormat = verifyPNGFormat;
