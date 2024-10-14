// HomePage.js
import React from 'react';

// HomePage component definition
function HomePage({ colors, connectedDevices, deviceCircleAssociation, handleConnectToDevice }) {
  // Calculate the number of connected devices
  const numberOfConnectedDevices = connectedDevices.length;

  return (
    // Main container for the HomePage component
    <div className="p-4 space-y-4">
      {/* Display the number of connected devices */}
      <div className="text-center p-2">
        Cosmoids: {numberOfConnectedDevices}
      </div>
      {/* Container for device circles */}
      <div className="flex justify-left gap-2">
        <div className="flex justify-around">
          {/* Iterate over the colors array to render circles for each potential device */}
          {colors.map((color, index) => {
            // Determine if the circle should be active (connected) or not
            const isActive = index < numberOfConnectedDevices;
            // Check if this is the next color in line to be connected
            const isNextToConnect = index === numberOfConnectedDevices;
            // Determine the next color to use, looping back to the start if necessary
            const nextColor = colors[index] || colors[0];
            // Define CSS classes for the circle based on active status and next color
            const circleClasses = `circle ${isActive ? `circle-${color}` : 'circle-disconnected'} ${isNextToConnect ? `border-${nextColor}` : ''}`;
            // Define CSS classes for the plus symbol based on next color
            const plusClasses = `circle-plus ${isNextToConnect ? `plus-${nextColor}` : ''}`;
            // Get the device and its details if it's connected
            const device = connectedDevices[index];
            const deviceId = device?.id;
            const forceValue = deviceId ? deviceCircleAssociation[deviceId]?.forceValue : undefined;

            return (
              // Render the circle for each device/color
              <div key={index} className={circleClasses} onClick={() => isNextToConnect && handleConnectToDevice()}>
                {/* Conditionally render the plus symbol or force value */}
                {isNextToConnect ? (
                  <span className={plusClasses}>+</span>
                ) : isActive && forceValue !== undefined ? (
                  // Display the force value if available
                  <p>
                    <strong>{forceValue}</strong><br />Force value
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
