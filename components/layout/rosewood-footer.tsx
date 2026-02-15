'use client';

import Link from 'next/link';

export default function RosewoodFooter() {
    return (
        <footer className="bg-[#F5F5F0] text-[#1C1C1C] pt-20 pb-10">
            <div className="container mx-auto px-6 md:px-12">

                {/* Newsletter Section */}
                <div className="border-b border-[#1C1C1C]/10 pb-16 mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="max-w-md">
                        <h3 className="text-2xl font-serif mb-4 tracking-wide text-[#1C1C1C]">Stay Connected</h3>
                        <p className="text-[#1C1C1C]/60 font-light text-sm leading-relaxed">
                            Join our mailing list to receive potential updates and exclusive offers from Olivia Global.
                        </p>
                    </div>
                    <div className="w-full md:w-auto flex-1 max-w-md">
                        <form className="flex border-b border-[#1C1C1C]/30 pb-2">
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="bg-transparent w-full outline-none text-[#1C1C1C] placeholder-[#1C1C1C]/40 text-sm tracking-wide"
                            />
                            <button className="text-xs uppercase tracking-[0.2em] hover:text-[#C5A572] transition-colors font-medium">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Links Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    {/* Column 1 */}
                    <div className="space-y-6">
                        <h4 className="text-xs uppercase tracking-[0.2em] text-[#8C7A5C] mb-6">Contact Us</h4>
                        <p className="text-sm font-light text-[#1C1C1C]/70">
                            Olivia International,<br />
                            Alappuzha,<br />
                            Kerala, India
                        </p>
                        <p className="text-sm font-light text-[#1C1C1C]/70 mt-4">
                            +91 1234 567890<br />
                            info@olivia-alappuzha.com
                        </p>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                        <h4 className="text-xs uppercase tracking-[0.2em] text-[#8C7A5C] mb-6">World of Olivia</h4>
                        <ul className="space-y-3 text-sm font-light text-[#1C1C1C]/70">
                            <li><Link href="#" className="hover:text-[#C5A572] transition-colors">Our Story</Link></li>
                            <li><Link href="#" className="hover:text-[#C5A572] transition-colors">Residences</Link></li>
                            <li><Link href="#" className="hover:text-[#C5A572] transition-colors">Careers</Link></li>
                            <li><Link href="#" className="hover:text-[#C5A572] transition-colors">Press Room</Link></li>
                        </ul>
                    </div>

                    {/* Column 3 */}
                    <div className="space-y-4">
                        <h4 className="text-xs uppercase tracking-[0.2em] text-[#8C7A5C] mb-6">Support</h4>
                        <ul className="space-y-3 text-sm font-light text-[#1C1C1C]/70">
                            <li><Link href="#" className="hover:text-[#C5A572] transition-colors">Manage Reservations</Link></li>
                            <li><Link href="#" className="hover:text-[#C5A572] transition-colors">Gift Cards</Link></li>
                            <li><Link href="#" className="hover:text-[#C5A572] transition-colors">Contact</Link></li>
                            <li><Link href="#" className="hover:text-[#C5A572] transition-colors">FAQ</Link></li>
                        </ul>
                    </div>

                    {/* Column 4 */}
                    <div className="space-y-4">
                        <h4 className="text-xs uppercase tracking-[0.2em] text-[#8C7A5C] mb-6">Legal</h4>
                        <ul className="space-y-3 text-sm font-light text-[#1C1C1C]/70">
                            <li><Link href="#" className="hover:text-[#C5A572] transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-[#C5A572] transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-[#C5A572] transition-colors">Accessibility</Link></li>
                            <li><Link href="#" className="hover:text-[#C5A572] transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Brand & Copyright */}
                <div className="flex flex-col items-center pt-12 border-t border-[#1C1C1C]/10">
                    <h1 className="text-4xl md:text-6xl font-serif tracking-[0.2em] text-[#1C1C1C]/10 mb-8 pointer-events-none select-none">
                        OLIVIA
                    </h1>
                    <div className="flex flex-col md:flex-row justify-between w-full text-[10px] uppercase tracking-widest text-[#1C1C1C]/40">
                        <p>© 2026 Olivia Hotel Group. All Rights Reserved.</p>
                        <div className="flex gap-6 mt-4 md:mt-0">
                            <Link href="#" className="hover:text-[#C5A572] transition-colors">Facebook</Link>
                            <Link href="#" className="hover:text-[#C5A572] transition-colors">Instagram</Link>
                            <Link href="#" className="hover:text-[#C5A572] transition-colors">WeChat</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
