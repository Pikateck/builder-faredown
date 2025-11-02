#!/usr/bin/env python3
import re

with open('client/components/ConversationalBargainModal.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find line 1510 (0-indexed as 1509) and replace !timerExpired && (
for i, line in enumerate(lines):
    if i == 1509:  # Line 1510
        if '!timerExpired && (' in line:
            lines[i] = line.replace('!timerExpired && (', '&& (')
            print(f"Modified line {i+1}")

# Find line 1511 (<>) and add the conditional wrapper after it
for i, line in enumerate(lines):
    if i == 1510 and '<>' in line:
        indent = '                    '
        lines.insert(i+1, indent + '{timerActive && !timerExpired && (\n')
        print(f"Inserted wrapper at line {i+2}")
        break

# Find the closing </div> for the info div and add closing paren
for i, line in enumerate(lines):
    if '</div>' in line and i > 1510 and i < 1540:
        # Check context
        context = ''.join(lines[max(0,i-15):i])
        if 'bg-blue-50' in context and 'Choose your price' in context:
            indent = '                      '
            lines.insert(i+1, indent + ')}\n')
            print(f"Inserted wrapper closing at line {i+2}")
            break

# Now fix the disabled states and class names for the buttons
# Find first "disabled={selectedPrice !== null || isBooking}" after line 1550
count = 0
for i, line in enumerate(lines):
    if 'disabled={selectedPrice !== null || isBooking}' in line and i > 1540:
        lines[i] = line.replace('disabled={selectedPrice !== null || isBooking}', 'disabled={selectedPrice !== null || isBooking || timerExpired}')
        print(f"Modified disabled state at line {i+1}")
        count += 1
        if count >= 2:
            break

# Fix the classnames for the buttons to handle timerExpired
# Find Safe Deal button class
for i, line in enumerate(lines):
    if ': "bg-emerald-50 text-emerald-900' in line and i > 1550 and i < 1600:
        # This should be one of the button style lines
        # Get the full className string
        if 'bg-emerald-100' in line:
            # This is likely the Safe Deal button's default style
            old_style = ': "bg-emerald-50 text-emerald-900 border-2 border-emerald-300 hover:bg-emerald-100"'
            new_style = ''': timerExpired
                              ? "bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed"
                              : "bg-emerald-50 text-emerald-900 border-2 border-emerald-300 hover:bg-emerald-100"'''
            if old_style in line:
                lines[i] = line.replace(old_style, new_style)
                print(f"Modified Safe Deal button style at line {i+1}")
                break

# Fix Final Offer button class
for i, line in enumerate(lines):
    if ': "bg-orange-50 text-orange-900' in line and i > 1580 and i < 1620:
        if 'bg-orange-100' in line:
            old_style = ': "bg-orange-50 text-orange-900 border-2 border-orange-300 hover:bg-orange-100"'
            new_style = ''': timerExpired
                              ? "bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed"
                              : "bg-orange-50 text-orange-900 border-2 border-orange-300 hover:bg-orange-100"'''
            if old_style in line:
                lines[i] = line.replace(old_style, new_style)
                print(f"Modified Final Offer button style at line {i+1}")
                break

# Find the "Book button" comment and add the new button after it
for i, line in enumerate(lines):
    if '/* Book button - only enabled when a price is selected AND timer is still active */' in line:
        # Find the closing of the button section (look for )} on its own)
        for j in range(i+1, min(i+30, len(lines))):
            if ')}' in lines[j] and 'selectedPrice && timerActive' in ''.join(lines[i:j]):
                # Insert new button after this
                new_button = '''

                    {/* Book at selected price button - show after timer expires if price was selected */}
                    {selectedPrice && timerExpired && (
                      <Button
                        onClick={() => handleAcceptOffer()}
                        disabled={isBooking}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 h-11 mobile-touch-target rounded-xl"
                        aria-label="Book at selected price"
                      >
                        {isBooking
                          ? "Processing..."
                          : `Book ${selectedPrice === "safe" ? "Safe" : "Final"} Deal - ${formatPrice(selectedPrice === "safe" ? safeDealPrice : finalOffer)}`}
                      </Button>
                    )}
'''
                lines.insert(j+1, new_button)
                print(f"Added new button after line {j+1}")
                break
        break

with open('client/components/ConversationalBargainModal.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("File updated successfully!")
