import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-6xl font-bold text-blue-600">404</h1>
      <h2 className="text-3xl font-semibold text-gray-800 mt-4">Page Not Found</h2>
      <p className="text-lg text-gray-600 mt-2">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-8 px-6 py-3 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700"
      >
        Go back home
      </Link>
    </div>
  );
};

export default NotFound;
