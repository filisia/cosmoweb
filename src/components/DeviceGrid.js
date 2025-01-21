import React from 'react';
import PropTypes from 'prop-types';

function DeviceGrid({ devices = [], onDeviceClick, activeDevice }) {
  if (!devices || devices.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No devices found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {devices.map((device) => (
        <div
          key={device.id}
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            activeDevice?.id === device.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
          onClick={() => onDeviceClick?.(device)}
        >
          <div className="text-center">
            <div className="font-medium">{device.name}</div>
            <div className="text-sm text-gray-500">ID: {device.id}</div>
            <div className="text-sm text-gray-500">RSSI: {device.rssi}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

DeviceGrid.propTypes = {
  devices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      rssi: PropTypes.number,
    })
  ),
  onDeviceClick: PropTypes.func,
  activeDevice: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),
};

DeviceGrid.defaultProps = {
  devices: [],
  onDeviceClick: () => {},
  activeDevice: null,
};

export default DeviceGrid; 