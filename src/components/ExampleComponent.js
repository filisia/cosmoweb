import React from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

function ExampleComponent() {
  const { sendCharacteristicOperation } = useWebSocket();
  const deviceId = 'your-device-id';

  const handleReadButtonStatus = () => {
    sendCharacteristicOperation(deviceId, 'READ_BUTTON_STATUS', []);
  };

  const handleSendCommand = (command) => {
    sendCharacteristicOperation(deviceId, 'WRITE_COMMAND', [command]);
  };

  return (
    <div>
      <button onClick={handleReadButtonStatus}>
        Read Button Status
      </button>
      <button onClick={() => handleSendCommand(1)}>
        Send Command 1
      </button>
    </div>
  );
}

export default ExampleComponent; 