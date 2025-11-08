import Link from 'next/link';

export default function Footer() {
  return (
    <>
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-lg font-semibold mb-3">4MK - ForMyKin</h4>
            <p className="text-gray-300 text-sm">
              Connecting communities through care and compassion. 
              Where neighbors help neighbors and kindness creates 
              lasting bonds.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-3">Quick Links</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li><Link href="/about" className="hover:text-white">How It Works</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-3">Connect</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li><Link href="https://facebook.com" className="hover:text-white">Facebook</Link></li>
              <li><a href="mailto:support@4mk.org" className="hover:text-white">support@4mk.org</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mx-auto max-w-6xl px-4 mt-8 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>&copy; 2025 4MK - ForMyKin. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
