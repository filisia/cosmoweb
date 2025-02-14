import React from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

function ExampleComponent() {
  const { sendCharacteristicOperation, connectedDevices } = useWebSocket();

  const handleReadButtonStatus = (deviceId) => {
    sendCharacteristicOperation(deviceId, 'READ_BUTTON_STATUS', []);
  };

  const handleSendCommand = (deviceId, command) => {
    sendCharacteristicOperation(deviceId, 'WRITE_COMMAND', [command]);
  };

  return (
    <div>
      {connectedDevices.map(device => (
        <div key={device.id}>
          <button onClick={() => handleReadButtonStatus(device.id)}>
            Read Button Status
          </button>
          <button onClick={() => handleSendCommand(device.id, 1)}>
            Send Command 1
          </button>
        </div>
      ))}
    </div>
  );
}

export default ExampleComponent; 