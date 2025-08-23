import React, { useState, useEffect, useRef } from "react";
import BargainButton from "@/components/ui/BargainButton";
import ConversationalBargainModal from "@/components/ConversationalBargainModal";
import {
  isMobileDevice,
  isIOS,
  isAndroid,
  isTouchDevice,
  hapticFeedback,
  getViewportHeight,
  preventZoomOnInput,
} from "@/lib/mobileUtils";
import { Check, X, Smartphone, Monitor, Tablet } from "lucide-react";

interface TestResult {
  test: string;
  passed: boolean;
  details?: string;
}

export function MobileBargainTestSuite() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Mock flight data for testing
  const mockFlight = {
    id: "test-flight-1",
    airline: "Test Airlines",
    flightNumber: "TA123",
    from: "Mumbai",
    to: "Dubai",
    departureTime: "10:00",
    arrivalTime: "12:30",
    price: 25000,
    duration: "3h 30m",
  };

  useEffect(() => {
    // Collect device information
    setDeviceInfo({
      isMobile: isMobileDevice(),
      isIOS: isIOS(),
      isAndroid: isAndroid(),
      isTouchDevice: isTouchDevice(),
      viewportHeight: getViewportHeight(),
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
    });
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: TestResult[] = [];

    // Test 1: Device Detection
    results.push({
      test: "Device Detection",
      passed: typeof isMobileDevice() === "boolean",
      details: `Mobile: ${isMobileDevice()}, iOS: ${isIOS()}, Android: ${isAndroid()}`,
    });

    // Test 2: Touch Device Detection
    results.push({
      test: "Touch Device Detection",
      passed: typeof isTouchDevice() === "boolean",
      details: `Touch supported: ${isTouchDevice()}`,
    });

    // Test 3: Viewport Height
    const viewportHeight = getViewportHeight();
    results.push({
      test: "Viewport Height Function",
      passed: viewportHeight > 0,
      details: `Height: ${viewportHeight}px`,
    });

    // Test 4: Input Zoom Prevention
    if (inputRef.current) {
      preventZoomOnInput(inputRef.current);
      const fontSize = window.getComputedStyle(inputRef.current).fontSize;
      results.push({
        test: "Input Zoom Prevention",
        passed: fontSize === "16px",
        details: `Font size: ${fontSize}`,
      });
    }

    // Test 5: Button Touch Target Size
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const minTouchTarget = 44; // iOS accessibility guidelines
      results.push({
        test: "Button Touch Target Size",
        passed:
          buttonRect.height >= minTouchTarget &&
          buttonRect.width >= minTouchTarget,
        details: `Size: ${Math.round(buttonRect.width)}x${Math.round(buttonRect.height)}px`,
      });
    }

    // Test 6: CSS Custom Properties Support
    const testElement = document.createElement("div");
    testElement.style.setProperty("--test-property", "test");
    const supportsCustomProps =
      testElement.style.getPropertyValue("--test-property") === "test";
    results.push({
      test: "CSS Custom Properties",
      passed: supportsCustomProps,
      details: `Supported: ${supportsCustomProps}`,
    });

    // Test 7: Touch Events Support
    const supportsTouchEvents = "ontouchstart" in window;
    results.push({
      test: "Touch Events API",
      passed: supportsTouchEvents,
      details: `Supported: ${supportsTouchEvents}`,
    });

    // Test 8: Vibration API (for haptic feedback fallback)
    const supportsVibration = "vibrate" in navigator;
    results.push({
      test: "Vibration API",
      passed: true, // Not required, but nice to have
      details: `Supported: ${supportsVibration}`,
    });

    // Test 9: CSS Grid Support
    const supportsGrid = CSS.supports("display", "grid");
    results.push({
      test: "CSS Grid Support",
      passed: supportsGrid,
      details: `Supported: ${supportsGrid}`,
    });

    // Test 10: Flexbox Support
    const supportsFlexbox = CSS.supports("display", "flex");
    results.push({
      test: "CSS Flexbox Support",
      passed: supportsFlexbox,
      details: `Supported: ${supportsFlexbox}`,
    });

    // Test 11: Intersection Observer (for scroll optimizations)
    const supportsIntersectionObserver = "IntersectionObserver" in window;
    results.push({
      test: "Intersection Observer API",
      passed: supportsIntersectionObserver,
      details: `Supported: ${supportsIntersectionObserver}`,
    });

    // Test 12: CSS Transform3D (for hardware acceleration)
    const supportsTransform3D = CSS.supports("transform", "translate3d(0,0,0)");
    results.push({
      test: "CSS Transform3D",
      passed: supportsTransform3D,
      details: `Supported: ${supportsTransform3D}`,
    });

    setTestResults(results);
    setIsRunning(false);
  };

  const testHapticFeedback = () => {
    hapticFeedback("medium");
  };

  const getDeviceIcon = () => {
    if (deviceInfo.isMobile) {
      return <Smartphone className="w-5 h-5" />;
    } else if (deviceInfo.windowWidth >= 768 && deviceInfo.windowWidth < 1024) {
      return <Tablet className="w-5 h-5" />;
    } else {
      return <Monitor className="w-5 h-5" />;
    }
  };

  const passedTests = testResults.filter((result) => result.passed).length;
  const totalTests = testResults.length;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          {getDeviceIcon()}
          Mobile Bargain Feature Test Suite
        </h2>

        {/* Device Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">
            Device Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <strong>Device Type:</strong>{" "}
              {deviceInfo.isMobile ? "Mobile" : "Desktop"}
            </div>
            <div>
              <strong>Touch Device:</strong>{" "}
              {deviceInfo.isTouchDevice ? "Yes" : "No"}
            </div>
            <div>
              <strong>Operating System:</strong>{" "}
              {deviceInfo.isIOS
                ? "iOS"
                : deviceInfo.isAndroid
                  ? "Android"
                  : "Other"}
            </div>
            <div>
              <strong>Screen Size:</strong> {deviceInfo.screenWidth}x
              {deviceInfo.screenHeight}
            </div>
            <div>
              <strong>Viewport Size:</strong> {deviceInfo.windowWidth}x
              {deviceInfo.windowHeight}
            </div>
            <div>
              <strong>Pixel Ratio:</strong> {deviceInfo.pixelRatio}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunning ? "Running Tests..." : "Run All Tests"}
            </button>

            <button
              onClick={testHapticFeedback}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Test Haptic Feedback
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Test Modal
            </button>
          </div>

          {/* Test Input Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Test Input (Zoom Prevention):
            </label>
            <input
              ref={inputRef}
              type="number"
              placeholder="Enter test price"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Test Button */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Test Bargain Button:
            </label>
            <BargainButton
              ref={buttonRef}
              onClick={() => console.log("Bargain button clicked!")}
              size="md"
            >
              Test Bargain Now
            </BargainButton>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Test Results</h3>
              <div className="text-sm">
                <span
                  className={`font-medium ${passedTests === totalTests ? "text-green-600" : "text-yellow-600"}`}
                >
                  {passedTests}/{totalTests} tests passed
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    result.passed
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  {result.passed ? (
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div
                      className={`font-medium ${result.passed ? "text-green-800" : "text-red-800"}`}
                    >
                      {result.test}
                    </div>
                    {result.details && (
                      <div
                        className={`text-sm ${result.passed ? "text-green-600" : "text-red-600"}`}
                      >
                        {result.details}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">
            Testing Instructions:
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Run on actual mobile devices for accurate results</li>
            <li>• Test with Chrome DevTools mobile simulation</li>
            <li>• Verify touch interactions and haptic feedback</li>
            <li>• Check modal responsiveness on different screen sizes</li>
            <li>• Test input field behavior with mobile keyboards</li>
            <li>• Verify button touch targets meet 44px minimum</li>
          </ul>
        </div>
      </div>

      {/* Test Modal */}
      <ConversationalBargainModal
        isOpen={showModal}
        flight={mockFlight}
        onClose={() => setShowModal(false)}
        onAccept={(price, orderRef) => {
          console.log("Accepted:", price, orderRef);
          setShowModal(false);
        }}
        onHold={(orderRef) => {
          console.log("Hold created:", orderRef);
        }}
        userName="Test User"
        module="flights"
        basePrice={mockFlight.price}
        productRef={mockFlight.id}
      />
    </div>
  );
}

export default MobileBargainTestSuite;
