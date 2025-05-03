import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dropdown, Button, Modal } from 'react-bootstrap';
import { FiMenu, FiUser, FiSettings, FiLogOut, FiMoon, FiSun } from 'react-icons/fi';
import { userData$, updateUserData } from '../services/dataService';
import { logout as authLogout } from '../services/authService';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if dark mode is enabled in localStorage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);

    if (savedDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    }

    // Subscribe to user data from the centralized data service
    const userDataSubscription = userData$.subscribe(userData => {
      if (userData) {
        console.log('Header received user data:', userData);
        if (userData.name && userData.name.trim() !== '') {
          setUserName(userData.name);
          setDisplayName(userData.name);
        } else if (userData.email) {
          // Use email as fallback
          const emailUsername = userData.email.split('@')[0];
          setUserName(emailUsername);
          setDisplayName(emailUsername);

          // If name is empty but we have first_name/last_name, update the name
          if (userData.first_name || userData.last_name) {
            const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
            if (fullName) {
              // Update the userData object with the new name
              userData = {
                ...userData,
                name: fullName
              };

              // Update the name state variables
              setUserName(fullName);
              setDisplayName(fullName);
            }
          }
        }

        // Store email if available
        if (userData.email) {
          setUserEmail(userData.email);
        }

        // Check if user is admin
        setIsAdmin(userData.is_admin === true);

        // Store user info in localStorage for other components
        localStorage.setItem('userInfo', JSON.stringify(userData));
      } else {
        // Clear user info if no data is available
        setUserName('');
        setDisplayName('');
        setUserEmail('');
        setIsAdmin(false);
      }
    });

    // Clean up subscription on unmount
    return () => {
      userDataSubscription.unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    // Use the centralized logout function
    authLogout();
    // No need to navigate as the authLogout function will redirect to the login page
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());

    if (newDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-blue-700 to-indigo-800 shadow-lg p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <h1
              className="text-xl font-bold text-white drop-shadow-lg cursor-pointer flex items-center"
              onClick={() => navigate("/dashboard")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              Credit Portal
            </h1>
          </div>

          {/* Main Navigation */}
          <div className="hidden md:flex space-x-1">
            {isAdmin ? (
              // Only show Admin Dashboard link for admin users
              <Link
                to="/admin-dashboard"
                className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                  isActive('/admin-dashboard')
                    ? 'bg-white text-blue-800'
                    : 'text-white hover:bg-blue-600'
                }`}
              >
                Admin Dashboard
              </Link>
            ) : (
              // Show regular navigation links for non-admin users
              <>
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                    isActive('/dashboard')
                      ? 'bg-white text-blue-800'
                      : 'text-white hover:bg-blue-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/loan-accounts"
                  className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                    isActive('/loan-accounts')
                      ? 'bg-white text-blue-800'
                      : 'text-white hover:bg-blue-600'
                  }`}
                >
                  Loan Accounts
                </Link>
                <Link
                  to="/credit-report"
                  className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                    isActive('/credit-report')
                      ? 'bg-white text-blue-800'
                      : 'text-white hover:bg-blue-600'
                  }`}
                >
                  Credit Report
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            {userName && (
              <div className="flex items-center mr-3 hidden md:flex">
                <div className="bg-blue-600 p-2 rounded-full text-white mr-2">
                  <FiUser size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-medium">
                    {userName}
                  </span>
                  <span className="text-blue-200 text-xs">
                    Welcome back!
                  </span>
                </div>
              </div>
            )}

            <Dropdown align="end">
              <Dropdown.Toggle
                as="div"
                className="cursor-pointer"
              >
                <div className="bg-blue-600 hover:bg-blue-500 p-2 rounded-full text-white">
                  <FiMenu size={24} />
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="mt-2 shadow-lg border-0 bg-white rounded-lg p-2 w-48">
                <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200 mb-1">
                  {userName ? `Signed in as ${userName}` : 'Menu'}
                </div>

                <Dropdown.Item
                  as="button"
                  className="rounded-md hover:bg-blue-50 flex items-center py-2"
                  onClick={() => setShowProfileModal(true)}
                >
                  <FiUser className="mr-2" /> Profile
                </Dropdown.Item>

                <Dropdown.Item
                  as="button"
                  className="rounded-md hover:bg-blue-50 flex items-center py-2"
                  onClick={toggleDarkMode}
                >
                  {darkMode ? (
                    <>
                      <FiSun className="mr-2" /> Light Mode
                    </>
                  ) : (
                    <>
                      <FiMoon className="mr-2" /> Dark Mode
                    </>
                  )}
                </Dropdown.Item>

                {!isAdmin && (
                  <Dropdown.Item
                    as="button"
                    className="rounded-md hover:bg-blue-50 flex items-center py-2"
                    onClick={() => navigate('/model-dashboard')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    ML Dashboard
                  </Dropdown.Item>
                )}

                <Dropdown.Divider />

                <Dropdown.Item
                  as="button"
                  className="rounded-md hover:bg-red-50 flex items-center py-2 text-red-600"
                  onClick={handleLogout}
                >
                  <FiLogOut className="mr-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-blue-800 text-white">
        <div className="flex justify-between overflow-x-auto py-2 px-4">
          {isAdmin ? (
            // Only show Admin Dashboard link for admin users
            <Link
              to="/admin-dashboard"
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${
                isActive('/admin-dashboard') ? 'bg-white text-blue-800 rounded-lg' : ''
              }`}
            >
              Admin Dashboard
            </Link>
          ) : (
            // Show regular navigation links for non-admin users
            <>
              <Link
                to="/dashboard"
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${
                  isActive('/dashboard') ? 'bg-white text-blue-800 rounded-lg' : ''
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/loan-accounts"
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${
                  isActive('/loan-accounts') ? 'bg-white text-blue-800 rounded-lg' : ''
                }`}
              >
                Loans
              </Link>
              <Link
                to="/credit-report"
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${
                  isActive('/credit-report') ? 'bg-white text-blue-800 rounded-lg' : ''
                }`}
              >
                Reports
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)}>
        <Modal.Header closeButton className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
          <Modal.Title>Your Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <div className="inline-block p-3 rounded-full bg-blue-100 mb-3">
              <FiUser size={48} className="text-blue-600" />
            </div>
            <h4 className="font-bold text-xl">{displayName || 'User'}</h4>
            <p className="text-gray-500">{userEmail}</p>

            {profileUpdated && (
              <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                Profile updated successfully!
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="font-medium block mb-2 text-gray-700">Display Name</label>
            <input
              type="text"
              className="form-control border rounded p-2 w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              This name will be displayed throughout the application
            </p>
          </div>

          <div className="mb-4">
            <label className="font-medium block mb-2 text-gray-700">Email Address</label>
            <input
              type="email"
              className="form-control border rounded p-2 w-full bg-gray-100"
              value={userEmail}
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div className="mb-3">
            <label className="font-medium block mb-2 text-gray-700">Preferences</label>
            <div className="flex items-center mb-2 p-2 bg-gray-50 rounded">
              <input
                className="form-check-input mr-2"
                type="checkbox"
                id="darkModeToggle"
                checked={darkMode}
                onChange={toggleDarkMode}
              />
              <label className="form-check-label" htmlFor="darkModeToggle">
                {darkMode ? 'Dark Mode Enabled' : 'Enable Dark Mode'}
              </label>
            </div>

            <div className="flex items-center p-2 bg-gray-50 rounded">
              <input className="form-check-input mr-2" type="checkbox" id="emailNotifications" defaultChecked />
              <label className="form-check-label" htmlFor="emailNotifications">
                Receive email notifications
              </label>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProfileModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              // Update user info using the centralized data service
              try {
                // Get current user data
                const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

                // Update with new display name
                const updatedUserInfo = {
                  ...userInfo,
                  name: displayName
                };

                // Update through the centralized data service
                updateUserData(updatedUserInfo);

                // Update local state
                setUserName(displayName);
                setProfileUpdated(true);

                // Hide success message after 3 seconds
                setTimeout(() => {
                  setProfileUpdated(false);
                }, 3000);
              } catch (e) {
                console.error('Error updating user info:', e);
              }
            }}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Header;
