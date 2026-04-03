import { Facebook, Instagram, Twitter, Linkedin, Youtube, Flame } from 'lucide-react';
import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-[#1E1B4B] text-white py-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Logo and Company Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-full"></div>
              </div>
              <span className="[font-family:'Lufga-Medium',Helvetica] font-medium text-xl">Q-worship</span>
            </div>

            {/* Address */}
            <div className="mb-6">
              <h4 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white mb-3">Address:</h4>
              <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 text-sm leading-relaxed">
                Devine Digital Technologies Office 9,<br />
                Dalton house<br />
                60 Windsor avenue, London, SW19 2RR,<br />
                United Kingdom
              </p>
            </div>

            {/* Contact */}
            <div className="mb-6">
              <h4 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white mb-3">Contact:</h4>
              <a 
                href="mailto:enquiries@qworship.com" 
                className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 text-sm hover:text-white transition-colors"
              >
                enquiries@qworship.com
              </a>
            </div>

            {/* Social Media Icons */}
            <div className="flex gap-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Youtube size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Flame size={20} />
              </a>
            </div>
          </div>

          {/* Navigation Links - Column 1 */}
          <div>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 hover:text-white transition-colors">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 hover:text-white transition-colors">
                  Book a demo
                </Link>
              </li>
              <li>
                <a href="#" className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <Link href="/pricing" className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/contact" className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Links - Column 2 */}
          <div>
            <ul className="space-y-4">
              <li>
                <Link href="/features" className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/signin" className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 hover:text-white transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Links - Column 3 */}
          <div>
            <ul className="space-y-4">
              <li>
                <a href="#" className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 hover:text-white transition-colors">
                  Style Guide
                </a>
              </li>
              <li>
                <a href="#" className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 hover:text-white transition-colors">
                  Changelog
                </a>
              </li>
              <li>
                <a href="#" className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 hover:text-white transition-colors">
                  Licenses
                </a>
              </li>
              <li>
                <a href="#" className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 hover:text-white transition-colors">
                  More Templates
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-600 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 text-sm">
            © 316. All rights reserved
          </p>
          
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center sm:justify-end">
            <Link href="/privacy-policy" className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 hover:text-white transition-colors text-sm underline">
              Privacy Policy
            </Link>
            <Link href="/refund-policy" className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 hover:text-white transition-colors text-sm underline">
              Refund Policy
            </Link>
            <Link href="/end-user-license" className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 hover:text-white transition-colors text-sm underline">
              End User License
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}