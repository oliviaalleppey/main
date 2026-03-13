'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function RosewoodFooter() {
    return (
        <footer className="bg-[#E8E2D9] text-[#1C1C1C] pt-20 pb-10">
            <div className="container mx-auto px-6 md:px-12">

                {/* Newsletter Section */}
                <div className="border-b border-[#2C2C2C]/12 pb-16 mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="max-w-md">
                        <h3 className="text-2xl font-serif mb-4 tracking-wide text-[#1C1C1C]">Stay Connected</h3>
                        <p className="text-[#4F4942] text-sm leading-relaxed">
                            Join our mailing list to receive potential updates and exclusive offers from Olivia Global.
                        </p>
                    </div>
                    <div className="w-full md:w-auto flex-1 max-w-md">
                        <form className="flex items-center gap-3 rounded-2xl border border-[#BEB4A8] bg-white px-4 py-3">
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="w-full bg-transparent outline-none text-[#1C1C1C] placeholder-[#726B64] text-sm tracking-wide"
                            />
                            <button className="rounded-xl bg-[#2C2C2C] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white hover:bg-[#1C1C1C] transition-colors font-medium">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Links Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    {/* Column 1 */}
                    <div className="space-y-6">
                        <h4 className="text-xs uppercase tracking-[0.22em] text-[#7A5E28] mb-6">Contact Us</h4>
                        <p className="text-sm text-[#403A35]">
                            Olivia International,<br />
                            Finishing Point, Punnamada,<br />
                            Alappuzha, Kerala - 688013,<br />
                            India
                        </p>
                        <p className="text-sm text-[#403A35] mt-4">
                            Primary (Landline): +91/0 477225088, +91/0 4772250800<br />
                            Primary: <a href="tel:+918075416514" className="underline decoration-[#2C2C2C]/20 hover:text-[#7A5E28] transition-colors">+91 8075 416 514</a><br />
                            Reservations: <a href="tel:+918075416514" className="underline decoration-[#2C2C2C]/20 hover:text-[#7A5E28] transition-colors">+91 8075 416 514</a><br />
                            WhatsApp: <a href="https://wa.me/918075416514" className="underline decoration-[#2C2C2C]/20 hover:text-[#7A5E28] transition-colors">+91 8075 416 514</a><br />
                            Main: <a href="mailto:reservation@oliviaalleppey.com" className="underline decoration-[#2C2C2C]/20 hover:text-[#7A5E28] transition-colors">reservation@oliviaalleppey.com</a><br />
                            Reservations: <a href="mailto:reservation@oliviaalleppey.com" className="underline decoration-[#2C2C2C]/20 hover:text-[#7A5E28] transition-colors">reservation@oliviaalleppey.com</a><br />
                            Support: <a href="mailto:mail@oliviaalleppey.com" className="underline decoration-[#2C2C2C]/20 hover:text-[#7A5E28] transition-colors">mail@oliviaalleppey.com</a><br />
                            Code: Outside India +91 | India 0<br />
                            Reservations: 09:00 - 18:00 | Front Desk: 24/7 hrs
                        </p>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                        <h4 className="text-xs uppercase tracking-[0.22em] text-[#7A5E28] mb-6">World of Olivia</h4>
                        <ul className="space-y-3 text-sm text-[#403A35]">
                            <li><Link href="#" className="hover:text-[#1C1C1C] transition-colors">Our Story</Link></li>
                            <li><Link href="#" className="hover:text-[#1C1C1C] transition-colors">Residences</Link></li>
                            <li><Link href="#" className="hover:text-[#1C1C1C] transition-colors">Careers</Link></li>
                            <li><Link href="#" className="hover:text-[#1C1C1C] transition-colors">Press Room</Link></li>
                        </ul>
                    </div>

                    {/* Column 3 */}
                    <div className="space-y-4">
                        <h4 className="text-xs uppercase tracking-[0.22em] text-[#7A5E28] mb-6">Support</h4>
                        <ul className="space-y-3 text-sm text-[#403A35]">
                            <li><Link href="#" className="hover:text-[#1C1C1C] transition-colors">Manage Reservations</Link></li>
                            <li><Link href="#" className="hover:text-[#1C1C1C] transition-colors">Gift Cards</Link></li>
                            <li><Link href="#" className="hover:text-[#1C1C1C] transition-colors">Contact</Link></li>
                            <li><Link href="#" className="hover:text-[#1C1C1C] transition-colors">FAQ</Link></li>
                        </ul>
                    </div>

                    {/* Column 4 */}
                    <div className="space-y-4">
                        <h4 className="text-xs uppercase tracking-[0.22em] text-[#7A5E28] mb-6">Legal</h4>
                        <ul className="space-y-3 text-sm text-[#403A35]">
                            <li><Link href="#" className="hover:text-[#1C1C1C] transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-[#1C1C1C] transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-[#1C1C1C] transition-colors">Accessibility</Link></li>
                            <li><Link href="#" className="hover:text-[#1C1C1C] transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Brand & Copyright */}
                <div className="flex flex-col items-center pt-12 border-t border-[#2C2C2C]/12">
                    <Link href="/" aria-label="Olivia Alleppey" className="mb-4 -mt-6">
                        <Image
                            src="/images/olivia-logo.svg"
                            alt="Olivia Alleppey"
                            width={400}
                            height={150}
                            className="h-[220px] md:h-[280px] w-auto max-w-[80vw] mx-auto opacity-100 transition-opacity duration-300 pointer-events-auto"
                        />
                    </Link>
                    <div className="flex flex-col md:flex-row justify-between w-full text-[10px] uppercase tracking-widest text-[#5E5851]">
                        <p>© 2026 Olivia Hotel Group. All Rights Reserved.</p>
                        <div className="flex gap-6 mt-4 md:mt-0">
                            <Link href="#" className="hover:text-[#1C1C1C] transition-colors">Facebook</Link>
                            <Link href="https://instagram.com/oliviaalleppey" target="_blank" rel="noopener noreferrer" className="hover:text-[#1C1C1C] transition-colors">Instagram</Link>
                            <Link href="#" className="hover:text-[#1C1C1C] transition-colors">WeChat</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
