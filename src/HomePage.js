// HomePage.js
import React from 'react';

function HomePage({ colors, connectedDevices, deviceCircleAssociation, handleConnectToDevice }) {
  const numberOfConnectedDevices = connectedDevices.length;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-left gap-2">
        <div className="flex justify-around">
          {colors.map((color, index) => {
            const isActive = index < numberOfConnectedDevices;
            const isNextToConnect = index === numberOfConnectedDevices;
            const nextColor = colors[index] || colors[0]; // Get next color or loop back to start
            const circleClasses = `circle ${isActive ? `circle-${color}` : 'circle-disconnected'} ${isNextToConnect ? `border-${nextColor}` : ''}`;
            const plusClasses = `circle-plus ${isNextToConnect ? `plus-${nextColor}` : ''}`;
            const device = connectedDevices[index];
            const deviceId = device?.id;
            const forceValue = deviceId ? deviceCircleAssociation[deviceId]?.forceValue : undefined;

            return (
              <div key={index} className={circleClasses} onClick={() => isNextToConnect && handleConnectToDevice()}>
                {isNextToConnect ? (
                  <span className={plusClasses}>+</span>
                ) : isActive && forceValue !== undefined ? (
                  <p>
                    <strong>{forceValue}</strong><br />Force value
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

      </div>
      <div className="text-center">
        Cosmoids: {numberOfConnectedDevices}
      </div>
    </div>
  );
}

export default HomePage;
