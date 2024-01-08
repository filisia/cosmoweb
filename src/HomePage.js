// HomePage.js
import React from 'react';

function HomePage({ colors, connectedDevices, deviceCircleAssociation, handleConnectToDevice }) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-around">
        {colors.map((color, index) => {
          const isActive = index < connectedDevices.length;
          const circleClasses = `circle circle-${color} ${isActive ? "circle-connected" : ""}`;
          const deviceId = connectedDevices[index]?.id;

          return (
            <div key={index} className={circleClasses} onClick={() => handleConnectToDevice(index)}>
              {deviceId && deviceCircleAssociation[deviceId] && (
                <p>Force: {deviceCircleAssociation[deviceId].forceValue}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HomePage;
