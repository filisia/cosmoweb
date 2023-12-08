import React, { useEffect, useState } from 'react';

const BrowserSpecificErrorMessage = ({ error }) => {
    const [browser, setBrowser] = useState('');

    useEffect(() => {
        // Function to detect the browser
        const detectBrowser = () => {
            const userAgent = navigator.userAgent;
            if (userAgent.includes("Opera") || userAgent.includes("OPR")) {
                return "Opera";
            } else if (userAgent.includes("Chrome")) {
                return "Chrome";
            } else if (userAgent.includes("Edg")) {
                return "Edge";
            } // Add more conditions for other browsers
            return "Unknown";
        };

        setBrowser(detectBrowser());
    }, []);

    if (!error) return null;

    // Function to render message based on the browser
    const renderBrowserSpecificMessage = () => {
        switch (browser) {
            case 'Opera':
                return (
                    <div>
                        <h3>Opera</h3>
                        <p>Follow these steps to enable Web Bluetooth in Opera:</p>
                        <ul>
                            <li>Type <code>opera://flags</code> in the address bar and press Enter.</li>
                            <li>Search for 'Web Bluetooth'.</li>
                            <li>Click the dropdown next to it and change it from 'Disabled' to 'Enabled'.</li>
                            <li>Relaunch Opera for the changes to take effect.</li>
                        </ul>
                    </div>
                );
            case 'Chrome':
                return (
                    <div>
                        <h3>Google Chrome</h3>
                        <p>Follow these steps to enable Web Bluetooth in Google Chrome:</p>
                        <ul>
                            <li>Type <code>chrome://flags</code> in the address bar and press Enter.</li>
                            <li>Search for 'Web Bluetooth'.</li>
                            <li>Enable the 'Web Bluetooth' flag.</li>
                            <li>Relaunch Chrome for the changes to take effect.</li>
                        </ul>
                    </div>
                );
            case 'Edge':
                return (
                    <div>
                        <h3>Microsoft Edge</h3>
                        <p>Web Bluetooth should be enabled by default in Microsoft Edge. If it's not working:</p>
                        <ul>
                            <li>Make sure you're using the latest version of Edge.</li>
                            <li>Check your site permissions to ensure Edge can access Bluetooth.</li>
                        </ul>
                    </div>
                );
            // Add more cases for different browsers
            default:
                return <p>Web Bluetooth API is not supported or is disabled in your browser.</p>;
        }
    };


    return (
        <div>
            <h2>Error: {error.message}</h2>
            {renderBrowserSpecificMessage()}
        </div>
    );
};

export default BrowserSpecificErrorMessage;
