import React, { useState } from "react";
import { Home, LogIn, Menu, X } from "lucide-react";

export default function Navbar() {
  // Add state to control mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toggle function for mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-black text-white shadow-md">
      <div className="  px-4">
        <div className="flex items-center  justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <span className="text-xl font-bold">Dello</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex  items-center   space-x-5">
            <div className="flex items-center px-3 py-2 rounded hover:bg-white hover:text-black transition duration-300 cursor-pointer">
              <Home size={15} className="mr-1" />
              <span className="text-sm">Home</span>
            </div>
            <div className="flex items-center px-3 py-2 rounded hover:bg-white hover:text-black transition duration-300 cursor-pointer">
              <LogIn size={15} className="mr-1" />
              <span className="text-sm">Login</span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              className="p-2 rounded-md hover:bg-neutral-700 focus:outline-none"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation*/}
        <div
          className={`md:hidden px-2 pt-2 pb-4 space-y-1 ${isMobileMenuOpen ? "block" : "hidden"}`}
        >
          <button className="flex items-center w-full px-3 py-2 rounded  transition-colors">
            <Home size={18} className="mr-1" />
            <span>Home</span>
          </button>
          <button className="flex items-center w-full px-3 py-2  rounded  transition-colors">
            <LogIn size={18} className="mr-1" />
            <span>Login</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
