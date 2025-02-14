// Map of operation names to UUIDs
const CHARACTERISTIC_UUIDS = {
  READ_BUTTON_STATUS: '000015251212efde1523785feabcd123',
  READ_SENSOR_VALUE: '000015251212efde1523785feabcd124',
  READ_BATTERY_LEVEL: '000015251212efde1523785feabcd125',
  READ_SERIAL_NUMBER: '000015251212efde1523785feabcd126',
  READ_FIRMWARE_VERSION: '000015251212efde1523785feabcd127',
  READ_HARDWARE_VERSION: '000015251212efde1523785feabcd128',
  WRITE_COMMAND: '000015251212efde1523785feabcd129'
};

// Helper function to get UUID from operation name
export const getCharacteristicUUID = (operationType) => {
  const uuid = CHARACTERISTIC_UUIDS[operationType];
  if (!uuid) {
    throw new Error(`Unknown characteristic operation: ${operationType}`);
  }
  return uuid;
};

// Helper function to get operation name from UUID
export const getOperationFromUUID = (uuid) => {
  const operation = Object.entries(CHARACTERISTIC_UUIDS)
    .find(([_, value]) => value === uuid)?.[0];
  
  if (!operation) {
    throw new Error(`Unknown characteristic UUID: ${uuid}`);
  }
  return operation;
}; 