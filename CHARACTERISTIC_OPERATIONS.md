# Cosmoid Bridge Characteristic Operations

This document describes how to work with BLE characteristic operations in a more developer-friendly way when integrating with the Cosmoid Bridge.

## Overview

Instead of working directly with UUID strings, we now provide a more readable and self-documenting API for BLE characteristic operations. This makes development more intuitive and less error-prone.

## Available Operations

The following characteristic operations are available:

### Device Status Operations
- `READ_BUTTON_STATUS` - Read the current button state
- `READ_SENSOR_VALUE` - Read the current sensor value

### Device Info Operations
- `READ_BATTERY_LEVEL` - Read the current battery level
- `READ_SERIAL_NUMBER` - Read the device serial number
- `READ_FIRMWARE_VERSION` - Read the firmware version
- `READ_HARDWARE_VERSION` - Read the hardware version

### Device Control Operations
- `WRITE_COMMAND` - Send a command to the device

## Usage Examples

### WebSocket Client Integration

Instead of using raw UUIDs in your WebSocket messages:

```javascript
// ❌ Old way - using raw UUIDs
ws.send(JSON.stringify({
  type: 'characteristicChanged',
  deviceId: deviceId,
  characteristicUUID: '000015251212efde1523785feabcd123',  // Hard to understand what this UUID is for
  value: [buttonState]
}));
```

You can now use the more readable operation names:

```javascript
// ✅ New way - using named operations
const { getCharacteristicUUID } = require('../common/characteristics');

ws.send(JSON.stringify({
  type: 'characteristicChanged',
  deviceId: deviceId,
  characteristicUUID: getCharacteristicUUID('READ_BUTTON_STATUS'),  // Clear and self-documenting
  value: [buttonState]
}));
```

### Handling WebSocket Messages

When processing incoming WebSocket messages, you can convert UUIDs back to operation names:

```javascript
const { getOperationFromUUID } = require('../common/characteristics');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'characteristicChanged') {
    const operation = getOperationFromUUID(message.characteristicUUID);
    
    switch (operation) {
      case 'READ_BUTTON_STATUS':
        handleButtonStateChange(message.value[0]);
        break;
      case 'READ_SENSOR_VALUE':
        handleSensorValueChange(message.value[0]);
        break;
      // ... handle other operations
    }
  }
};
```

## Benefits

1. **Self-Documenting Code**: Operation names clearly indicate their purpose
2. **Type Safety**: TypeScript-friendly enum-like structure prevents typos
3. **Centralized Definitions**: All characteristic operations are defined in one place
4. **Better Developer Experience**: No need to memorize or look up UUIDs
5. **Documentation**: Each operation includes a description of its purpose

## Helper Functions

### `getCharacteristicUUID(operationType)`
Converts an operation name to its corresponding UUID.

```javascript
const uuid = getCharacteristicUUID('READ_BUTTON_STATUS');
```

### `getOperationFromUUID(uuid)`
Converts a UUID back to its operation name.

```javascript
const operation = getOperationFromUUID('000015251212efde1523785feabcd123');
// Returns: 'READ_BUTTON_STATUS'
```

## Error Handling

Both helper functions will throw an error if an invalid operation name or UUID is provided:

```javascript
try {
  const uuid = getCharacteristicUUID('INVALID_OPERATION');
} catch (error) {
  console.error('Unknown characteristic operation');
}

try {
  const operation = getOperationFromUUID('invalid-uuid');
} catch (error) {
  console.error('Unknown characteristic UUID');
}
```

## Best Practices

1. Always use operation names instead of raw UUIDs in your code
2. Handle potential errors when converting between operations and UUIDs
3. Use the provided helper functions instead of storing UUIDs in your application code
4. Refer to this documentation when adding new characteristic operations 