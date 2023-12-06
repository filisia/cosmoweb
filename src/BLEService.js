export const scanForDevices = async () => {
    try {
      const filters = [{ services: ['00001523-1212-efde-1523-785feabcd123'] }]; 
      const device = await navigator.bluetooth.requestDevice({ filters });
      return device;
    } catch (error) {
      console.error('Error in scanning for BLE devices:', error);
      throw error;
    }
};

export const connectToDevice = async (device) => {
    try {
      const server = await device.gatt.connect();
      return server;
    } catch (error) {
      console.error('Error in connecting to BLE device:', error);
      throw error;
    }
};

export const startNotifications = async (server, serviceUUID, characteristicUUID, callback) => {
    try {
      const service = await server.getPrimaryService(serviceUUID);
      const characteristic = await service.getCharacteristic(characteristicUUID);
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', callback);
      return characteristic;
    } catch (error) {
      console.error('Error in starting notifications:', error);
      throw error;
    }
};

// Add a function to stop notifications if needed
export const stopNotifications = async (characteristic) => {
    try {
      await characteristic.stopNotifications();
      characteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
    } catch (error) {
      console.error('Error in stopping notifications:', error);
      throw error;
    }
};

// Example callback function for handling characteristic value changes
function handleCharacteristicValueChanged(event) {
    const value = event.target.value;
    console.log('Characteristic value changed:', value);
}
