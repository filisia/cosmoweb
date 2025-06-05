import React from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

function ConnectionLogs() {
  const { connectionLogs, wsConnected, connectionError } = useWebSocket();

  return (
    <div className="fixed bottom-0 right-0 w-96 h-64 bg-white shadow-lg rounded-t-lg overflow-hidden">
      <div className="bg-gray-800 text-white p-2 flex justify-between items-center">
        <h3 className="font-semibold">Connection Logs</h3>
        <div className="flex items-center space-x-2">
          <span className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm">{wsConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      {connectionError && (
        <div className="bg-red-100 border-l-4 border-red-500 p-2">
          <p className="text-red-700">{connectionError}</p>
        </div>
      )}

      <div className="h-48 overflow-y-auto p-2 font-mono text-sm">
        {connectionLogs.map((log, index) => (
          <div 
            key={index} 
            className={`mb-1 ${
              log.type === 'error' ? 'text-red-600' :
              log.type === 'success' ? 'text-green-600' :
              log.type === 'warning' ? 'text-yellow-600' :
              'text-gray-600'
            }`}
          >
            <span className="text-gray-400">{log.timestamp.split('T')[1].split('.')[0]}</span>
            <span className="ml-2">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConnectionLogs; 