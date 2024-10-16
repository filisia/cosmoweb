// BLEService.js

// Function to initiate scanning for BLE devices
export const scanForDevices = async () => {
  try {
    const deviceInfoServiceUUID = '0000180a-0000-1000-8000-00805f9b34fb';
    const mainServiceUUID = '00001523-1212-efde-1523-785feabcd123';

    // Define the filters for the devices to be scanned (by services)
    const filters = [{ services: [mainServiceUUID] }];
    
    // Request the device using the defined filters and include deviceInfoServiceUUID in optionalServices
    const device = await navigator.bluetooth.requestDevice({ 
      filters,
      optionalServices: [deviceInfoServiceUUID]
    });
    
    return device;
  } catch (error) {
    // Error handling for scanning process
    console.error('Error scanning for devices:', error);
    throw error;
  }
};

// Function to establish a connection with a BLE device
export const connectToDevice = async (device) => {
  try {
    // Connect to the device's GATT server
    const server = await device.gatt.connect();
    return server;
  } catch (error) {
    // Error handling for connection process
    console.error('Error in connecting to BLE device:', error);
    throw error;
  }
};

// Function to start notifications for a BLE characteristic
export const startNotifications = async (server, serviceUUID, characteristicUUID, callback) => {
  try {
    // Get the primary service from the server using the service UUID
    const service = await server.getPrimaryService(serviceUUID);
    // Get the characteristic from the service using its UUID
    const characteristic = await service.getCharacteristic(characteristicUUID);
    // Start notifications for changes in the characteristic's value
    await characteristic.startNotifications();
    // Add an event listener for value changes in the characteristic
    characteristic.addEventListener('characteristicvaluechanged', callback);
    return characteristic;
  } catch (error) {
    // Error handling for starting notifications
    console.error('Error in starting notifications:', error);
    throw error;
  }
};

// Function to stop notifications for a BLE characteristic
export const stopNotifications = async (characteristic) => {
  try {
    // Stop notifications for the given characteristic
    await characteristic.stopNotifications();
    // Remove the event listener for value changes
    characteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
  } catch (error) {
    // Error handling for stopping notifications
    console.error('Error in stopping notifications:', error);
    throw error;
  }
};

// Callback function for handling changes in characteristic value
function handleCharacteristicValueChanged(event) {
  const value = event.target.value;
  console.log('Characteristic value changed:', value);
}

// Function to write data to a BLE characteristic
export const writeToCharacteristic = async (server, serviceUUID, characteristicUUID, valueArray) => {
  try {
    // Get the primary service from the server using the service UUID
    const service = await server.getPrimaryService(serviceUUID);
    // Get the characteristic from the service using its UUID
    const characteristic = await service.getCharacteristic(characteristicUUID);
    // Convert the provided array to Uint8Array format
    const value = new Uint8Array(valueArray);
    // Write the value to the characteristic
    await characteristic.writeValue(value);
  } catch (error) {
    // Error handling for writing to characteristic
    console.error('Error in writing to characteristic:', error);
    throw error;
  }
};

// Function to set up an event listener for device disconnection
export const onDeviceDisconnected = (device, callback) => {
  // Assign the provided callback to the 'gattserverdisconnected' event
  device.ongattserverdisconnected = callback;
};

// Add this function to BLEService.js
export const readCharacteristic = async (server, serviceUUID, characteristicUUID) => {
  try {
    const service = await server.getPrimaryService(serviceUUID);
    const characteristic = await service.getCharacteristic(characteristicUUID);
    const value = await characteristic.readValue();
    console.log(`Read characteristic ${characteristicUUID}:`, value);
    return value;
  } catch (error) {
    console.error(`Error reading characteristic ${characteristicUUID}:`, error);
    throw error;
  }
};
