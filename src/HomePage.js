// HomePage.js
import React, { useEffect, useState } from 'react';
import wsService from './services/WebSocketService';
import { useWebSocket } from './contexts/WebSocketContext';
import cosmoLogo from './assets/images/cosmo_logo.png';

function HomePage({ colors }) {
  const { 
    wsConnected, 
    connectionError, 
    connectedDevices, 
    deviceInfo, 
    deviceValues 
  } = useWebSocket();
  
  const [lockState, setLockState] = useState({ isLocked: false, deviceIds: [] });
  const [lastScanTime, setLastScanTime] = useState(new Date());

  // Debug: Log connected devices and their connection status
  React.useEffect(() => {
    if (connectedDevices && connectedDevices.length > 0) {
      console.log('HomePage - Connected Devices:', connectedDevices.map(device => ({
        id: device.id,
        name: device.name,
        connected: device.connected,
        status: device.status,
        serial: device.serial,
        firmware: device.firmware,
        batteryLevel: device.batteryLevel
      })));
    }
  }, [connectedDevices]);

  // Handle lock/unlock functionality
  const handleLockDevices = () => {
    const newLockState = !lockState.isLocked;
    const deviceIds = newLockState ? connectedDevices.filter(d => d.connected).map(d => d.id) : [];
    
    const lockMessage = {
      type: 'lockDevices',
      isLocked: newLockState,
      deviceIds: deviceIds
    };
    
    wsService.sendMessage(lockMessage);
    setLockState({ isLocked: newLockState, deviceIds });
  };

  // Handle scan devices
  const handleScanDevices = () => {
    const scanMessage = { type: 'getDevices' };
    wsService.sendMessage(scanMessage);
    setLastScanTime(new Date());
  };

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get device status display
  const getDeviceStatus = (device) => {
    if (device.status === 'available') return 'Available';
    if (device.connected) return 'Connected';
    return 'Available';
  };

  // Get status CSS class
  const getStatusClass = (device) => {
    if (device.status === 'available') return 'status-available';
    if (device.connected) return 'status-connected';
    return 'status-available';
  };

  // Always render the hero section with logo and info
  const HeroSection = (
    <div className="bg-white rounded-xl shadow-md p-8 mb-8 flex flex-col md:flex-row items-center gap-8">
      <div>
        <h1 className="text-3xl font-bold text-purple-800 mb-2">Welcome to Cosmoweb</h1>
        <p className="text-gray-700 text-lg mb-2 max-w-2xl">
          Cosmoweb is a modern web interface for Filisia's Cosmo devices, enabling real-time, interactive experiences for therapy, education, and play. Connect your Cosmo devices via the Cosmoid Bridge and control them directly from your browser.
        </p>
        <p className="text-gray-600 text-base max-w-2xl">
          <span className="font-semibold">How it works:</span> <br/>
          <span className="inline-block mt-1">
            <span className="font-medium text-purple-700">1.</span> Start the <span className="font-semibold">Cosmoid Bridge</span> app on your computer.<br/>
            <span className="font-medium text-purple-700">2.</span> Power on your Cosmo devices and keep them nearby.<br/>
            <span className="font-medium text-purple-700">3.</span> Devices will appear below when connected.<br/>
            <span className="font-medium text-purple-700">4.</span> Explore games and activities from the menu!
          </span>
        </p>
        <a
          href="https://github.com/filisia/cosmowebdocs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-4 text-blue-600 hover:underline text-sm"
        >
          Learn more in the documentation
        </a>
      </div>
    </div>
  );

  if (!wsConnected || connectionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
        {HeroSection}
        <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center max-w-lg w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Waiting for Cosmoid Bridge...
          </h2>
          <p className="text-gray-600 text-center text-base max-w-md">
            Cosmoweb is trying to connect to the Cosmoid Bridge on your computer.<br />
            <span className="block mt-2">Please make sure the Cosmoid Bridge application is running.<br />
            If you haven't installed it yet, <a href="https://drive.google.com/file/d/1QXPr67vYiePTso6lsO33KBVpTza1x6_6/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">download it here</a>.</span>
            <span className="block mt-2">Use a supported browser (Chrome or Edge).</span>
            <span className="block mt-2">If the bridge is running and you still see this message, try refreshing the page.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cosmo-container">
      {HeroSection}
      {/* DEVICE TABLE SECTION */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Connected Cosmo Devices</h2>
            <p className="text-gray-500 text-sm mt-1">These are the Cosmo devices currently detected by your browser. Make sure your devices are powered on and nearby.</p>
          </div>
          <div className="flex items-center gap-3 mt-2 md:mt-0">
            <button 
              onClick={handleLockDevices}
              className={`cosmo-button cosmo-lock-button ${lockState.isLocked ? 'locked' : ''}`}
              title={lockState.isLocked ? 'Unlock all devices' : 'Lock all devices'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              {lockState.isLocked ? 'Unlock Devices' : 'Lock Devices'}
            </button>
          </div>
        </div>
        <div className="cosmo-devices-table-container">
          <table className="cosmo-devices-table">
            <thead>
              <tr>
                <th>Serial No.</th>
                <th>Firmware</th>
                <th>Battery</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {connectedDevices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="cosmo-no-devices">
                    No devices found. Make sure your Cosmo devices are powered on and nearby.
                  </td>
                </tr>
              ) : (
                connectedDevices.map((device) => (
                  <tr key={device.id}>
                    <td>{device.serialNumber || device.serial || 'N/A'}</td>
                    <td>{device.firmwareVersion || device.firmware || 'N/A'}</td>
                    <td>{device.batteryLevel !== undefined ? `${device.batteryLevel}%` : 'N/A'}</td>
                    <td>
                      <span className={getStatusClass(device)}>
                        {getDeviceStatus(device)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
