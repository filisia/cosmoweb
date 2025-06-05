# Lock/Unlock WebSocket API Documentation

## Overview
This document describes the WebSocket interface for locking and unlocking Cosmoid devices. This functionality allows web applications to control which devices can be accessed and manipulated through the Cosmoid Bridge.

## Lock/Unlock Mechanism

The lock/unlock mechanism provides the following capabilities:
- Lock specific devices to prevent unauthorized access
- Unlock devices to allow access
- Control which devices can be discovered and connected to

### Client to Server Messages

#### Lock/Unlock Devices
```json
{
  "type": "lockDevices",
  "isLocked": true|false,
  "deviceIds": ["device_id_1", "device_id_2", ...]
}
```

**Parameters:**
- `isLocked` (boolean): Set to `true` to enable device locking, `false` to disable it
- `deviceIds` (array): Array of device IDs that are allowed to be accessed when locking is enabled. This parameter is only relevant when `isLocked` is `true`.

**Example - Lock specific devices:**
```javascript
// Lock specific devices (only these devices will be accessible)
socket.send(JSON.stringify({
  type: 'lockDevices',
  isLocked: true,
  deviceIds: ['c8df84762c5a', 'a1b2c3d4e5f6']
}));
```

**Example - Unlock all devices:**
```javascript
// Unlock all devices (all devices will be accessible)
socket.send(JSON.stringify({
  type: 'lockDevices',
  isLocked: false,
  deviceIds: []
}));
```

### Server to Client Messages

#### Lock/Unlock Result
```json
{
  "type": "lockResult",
  "success": true|false,
  "isLocked": true|false,
  "deviceIds": ["device_id_1", "device_id_2", ...],
  "error": "Error message if success is false"
}
```

**Parameters:**
- `success` (boolean): Indicates if the lock/unlock operation was successful
- `isLocked` (boolean): Current lock state after the operation
- `deviceIds` (array): Array of device IDs that are allowed to be accessed
- `error` (string): Error message if the operation failed (only present when `success` is `false`)

**Example - Handling lock result:**
```javascript
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'lockResult') {
    if (message.success) {
      console.log(`Device lock state updated: ${message.isLocked ? 'LOCKED' : 'UNLOCKED'}`);
      console.log(`Allowed devices: ${message.deviceIds.join(', ')}`);
    } else {
      console.error(`Failed to update device lock state: ${message.error}`);
    }
  }
});
```

#### Updated Devices List
After a lock/unlock operation, the server will automatically broadcast an updated devices list to all connected clients:

```json
{
  "type": "devicesList",
  "devices": [
    {
      "id": "device_id_1",
      "name": "Device Name",
      "connected": true|false,
      ...
    },
    ...
  ]
}
```

**Example - Handling updated device list:**
```javascript
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'devicesList') {
    console.log(`Received updated list of ${message.devices.length} devices after lock state change`);
    // Update UI with the new device list
    updateDeviceList(message.devices);
  }
});
```

## Implementation Notes

### Lock State Behavior
1. When devices are locked (`isLocked: true`):
   - Only devices with IDs in the `deviceIds` array can be discovered, connected to, and controlled
   - Other devices will still be visible but marked as unavailable
   - Operations on locked devices will be rejected

2. When devices are unlocked (`isLocked: false`):
   - All devices can be discovered, connected to, and controlled
   - The `deviceIds` parameter is ignored in this state

### Best Practices
1. Always check the `lockResult` response to confirm the operation was successful
2. Update your UI based on the device lock state to prevent users from attempting operations on locked devices
3. Handle the automatic device list update that follows a lock/unlock operation
4. Consider implementing permission controls in your application to determine who can lock/unlock devices
