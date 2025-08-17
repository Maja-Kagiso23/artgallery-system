// components/Footer.jsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Art Gallery</h3>
            <p className="text-gray-300">
              Discover amazing artworks from talented artists around the world. 
              Experience curated exhibitions and connect with the art community.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/artists" className="text-gray-300 hover:text-white transition-colors">
                  Artists
                </a>
              </li>
              <li>
                <a href="/artpieces" className="text-gray-300 hover:text-white transition-colors">
                  Art Pieces
                </a>
              </li>
              <li>
                <a href="/exhibitions" className="text-gray-300 hover:text-white transition-colors">
                  Exhibitions
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="text-gray-300 space-y-2">
              <p>Email: info@artgallery.com</p>
              <p>Phone: +1 (555) 123-4567</p>
              <p>Address: 123 Art Street, Creative City</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; 2024 Art Gallery. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
