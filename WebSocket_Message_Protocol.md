# WebSocket Message Protocol Specification

## Overview
This document details the exact message formats required for WebSocket communication between the Electron server and web client.

## Connection Messages

### Device Connected
Sent when a device establishes connection

```json
{
    "type": "deviceConnected",
    "device": {
        "id": "00:11:22:33:44:55",
        "name": "Cosmoid-ABC",
        "connected": true,
        "rssi": -65
    }
}
```

### Device Disconnected
Sent when a device disconnects

```json
{
    "type": "deviceDisconnected",
    "deviceId": "00:11:22:33:44:55"
}
```

### Device Found
Sent when a new device is discovered during scanning

```json
{
    "type": "deviceFound",
    "device": {
        "id": "00:11:22:33:44:55",
        "name": "Cosmoid-ABC",
        "rssi": -65,
        "connected": false
    }
}
```

## Device Information Messages

### Device Info Update
Sent when device information is retrieved or updated

```json
{
    "type": "deviceInfo",
    "deviceId": "00:11:22:33:44:55",
    "info": {
        "serialNumber": "CSM2023001",
        "hardwareRevision": "1.0",
        "firmwareRevision": "2.1",
        "batteryLevel": 85
    }
}
```

## Sensor Value Messages

### Force Sensor Update
Sent when the force sensor value changes

```json
{
    "type": "characteristicChanged",
    "deviceId": "00:11:22:33:44:55",
    "characteristicUUID": "00001524-1212-efde-1523-785feabcd123",
    "value": [42]  // Single byte array containing force value
}
```

### Button Press Update
Sent when button state changes

```json
{
    "type": "characteristicChanged",
    "deviceId": "00:11:22:33:44:55",
    "characteristicUUID": "00001525-1212-efde-1523-785feabcd123",
    "value": [1]  // 1 = pressed, 0 = released
}
```

## Error Messages

### Connection Error
Sent when a connection error occurs

```json
{
    "type": "error",
    "errorType": "connectionError",
    "deviceId": "00:11:22:33:44:55",  // Optional
    "message": "Failed to connect to device"
}
```

### Command Error
Sent when a command fails to execute

```json
{
    "type": "error",
    "errorType": "commandError",
    "deviceId": "00:11:22:33:44:55",
    "command": "setColor",
    "message": "Invalid color values provided"
}
```

## Device List Messages

### Complete Devices List
Sent in response to a devices list request

```json
{
    "type": "devicesList",
    "devices": [
        {
            "id": "00:11:22:33:44:55",
            "name": "Cosmoid-ABC",
            "connected": true,
            "rssi": -65
        },
        {
            "id": "66:77:88:99:AA:BB",
            "name": "Cosmoid-XYZ",
            "connected": false,
            "rssi": -72
        }
    ]
}
```

## Important Notes

1. All deviceId fields should be the MAC address or unique identifier of the device
2. RSSI values are negative integers representing signal strength in dBm
3. Characteristic UUIDs must be in the format specified in the BLE protocol
4. All binary values (like sensor readings) should be sent as byte arrays
5. Message types are case-sensitive strings

## Required Fields
- All messages must include a "type" field
- Device-specific messages must include "deviceId"
- Characteristic updates must include "characteristicUUID" and "value"
- Error messages must include "errorType" and "message"

## Message Flow Examples

### Typical Connection Sequence
1. Client connects to WebSocket server
2. Server sends "devicesList" with currently known devices
3. When new device found: "deviceFound" message
4. On successful connection: "deviceConnected" message
5. After connection: "deviceInfo" message with device details
6. During operation: "characteristicChanged" messages for sensor updates

### Disconnection Sequence
1. Device disconnects
2. Server sends "deviceDisconnected" message
3. Server updates devices list
4. Server sends new "devicesList" message 