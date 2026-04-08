'use client';

import Link from 'next/link';
import Image from 'next/image';
import NewsletterForm from './newsletter-form';

export default function RosewoodFooter() {
    return (
        <footer className="bg-[var(--surface-soft)] text-[var(--text-dark)] pt-10 pb-6">
            <div className="max-w-7xl mx-auto px-6 md:px-12">

                {/* Newsletter Section */}
                <div className="border-b border-[var(--btn-dark)]/12 pb-8 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-7">
                    <div className="max-w-md">
                        <h3 className="text-2xl font-serif mb-3 tracking-wide text-[var(--text-dark)]">Stay Connected</h3>
                        <p className="text-[#4F4942] text-base leading-relaxed">
                            Join our mailing list to receive potential updates and exclusive offers from Olivia International.
                        </p>
                    </div>

                    <div className="w-full md:max-w-xl">
                        <NewsletterForm />
                    </div>
                </div>

                {/* Links Grid */}
                <div className="grid md:grid-cols-12 gap-8 lg:gap-10 mb-8">
                    {/* Contact */}
                    <div className="md:col-span-5 lg:col-span-4">
                        <h4 className="text-[11px] uppercase tracking-[0.28em] text-[#6B645C] mb-6">Contact us</h4>
                        <div className="space-y-4 text-[15px] text-[#403A35] leading-relaxed">
                            <p>
                                Olivia International,<br />
                                Finishing Point, Punnamada,<br />
                                Alappuzha, Kerala - 688013, India
                            </p>

                            <div className="space-y-2">
                                <p className="text-[11px] uppercase tracking-[0.24em] text-[#6B645C]">Phone</p>
                                <a href="tel:+918075416514" className="underline decoration-[var(--btn-dark)]/20 hover:text-[var(--text-dark)] transition-colors">
                                    +91 8075 416 514
                                </a>
                                <p className="text-[13px] text-[#4F4942]">
                                    Reservations: 09:00 - 18:00<br />
                                    Front Desk: 24/7
                                </p>
                            </div>

                            <p className="text-[13px] text-[#4F4942]">
                                WhatsApp:{' '}
                                <a href="https://wa.me/918075416514" className="underline decoration-[var(--btn-dark)]/20 hover:text-[var(--text-dark)] transition-colors">
                                    +91 8075 416 514
                                </a>
                                <br />
                                Primary (Landline): +91/0 477225088, +91/0 4772250800
                            </p>
                        </div>
                    </div>

                    {/* Email column (separate, aligned with other headings) */}
                    <div className="md:col-span-3 lg:col-span-3">
                        <h4 className="text-[11px] uppercase tracking-[0.28em] text-[#6B645C] mb-6">Email</h4>
                        <div className="space-y-3 text-[15px] text-[#403A35]">
                            <a
                                href="mailto:reservation@oliviaalleppey.com"
                                className="block underline decoration-[var(--btn-dark)]/20 hover:text-[var(--text-dark)] transition-colors"
                            >
                                reservation@oliviaalleppey.com
                            </a>
                            <a
                                href="mailto:mail@oliviaalleppey.com"
                                className="block underline decoration-[var(--btn-dark)]/20 hover:text-[var(--text-dark)] transition-colors"
                            >
                                mail@oliviaalleppey.com
                            </a>
                        </div>
                    </div>

                    <div className="md:col-span-4 lg:col-span-5 grid grid-cols-2 md:grid-cols-3 gap-8 lg:gap-10">
                        <div>
                            <h4 className="text-[11px] uppercase tracking-[0.28em] text-[#6B645C] mb-6">World of Olivia</h4>
                            <ul className="space-y-3 text-[15px] text-[#403A35]">
                                <li><Link href="over" className="hover:text-[var(--text-dark)] transition-colors">Our Story</Link></li>
                                <li><Link href="#" className="hover:text-[var(--text-dark)] transition-colors">Residences</Link></li>
                                <li><Link href="mailto:hr@oliviaalleppey.com" className="hover:text-[var(--text-dark)] transition-colors">Careers</Link></li>
                                <li><Link href="#" className="hover:text-[var(--text-dark)] transition-colors">Press Room</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-[11px] uppercase tracking-[0.28em] text-[#6B645C] mb-6">Support</h4>
                            <ul className="space-y-3 text-[15px] text-[#403A35]">
                                <li><Link href="#" className="hover:text-[var(--text-dark)] transition-colors">Manage Reservations</Link></li>
                                <li><Link href="#" className="hover:text-[var(--text-dark)] transition-colors">Gift Cards</Link></li>
                                <li><Link href="#" className="hover:text-[var(--text-dark)] transition-colors">Contact</Link></li>
                                <li><Link href="#" className="hover:text-[var(--text-dark)] transition-colors">FAQ</Link></li>
                            </ul>
                        </div>

                        <div className="hidden md:block">
                            <h4 className="text-[11px] uppercase tracking-[0.28em] text-[#6B645C] mb-6">Legal</h4>
                            <ul className="space-y-3 text-[15px] text-[#403A35]">
                                <li><Link href="#" className="hover:text-[var(--text-dark)] transition-colors">Privacy Policy</Link></li>
                                <li><Link href="#" className="hover:text-[var(--text-dark)] transition-colors">Terms of Service</Link></li>
                                <li><Link href="#" className="hover:text-[var(--text-dark)] transition-colors">Accessibility</Link></li>
                                <li><Link href="#" className="hover:text-[var(--text-dark)] transition-colors">Cookie Policy</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Legal (mobile/tablet) */}
                <div className="lg:hidden mb-10">
                    <h4 className="text-[11px] uppercase tracking-[0.28em] text-[#6B645C] mb-6">Legal</h4>
                    <ul className="grid grid-cols-2 gap-y-3 text-[15px] text-[#403A35]">
                        <li><Link href="#" className="hover:text-[var(--text-dark)] transition-colors">Privacy Policy</Link></li>
                        <li><Link href="#" className="hover:text-[var(--text-dark)] transition-colors">Terms of Service</Link></li>
                        <li><Link href="#" className="hover:text-[var(--text-dark)] transition-colors">Accessibility</Link></li>
                        <li><Link href="#" className="hover:text-[var(--text-dark)] transition-colors">Cookie Policy</Link></li>
                    </ul>
                </div>

                {/* Brand & Copyright */}
                <div className="pt-7 border-t border-[var(--btn-dark)]/12">
                    <div className="flex flex-col items-center">
                        <Link href="/" aria-label="Olivia Alleppey" className="mb-3">
                            <Image
                                src="/images/olivia-logo.svg"
                                alt="Olivia Alleppey"
                                width={380}
                                height={140}
                                className="h-[96px] md:h-[110px] w-auto max-w-[80vw] mx-auto opacity-100 transition-opacity duration-300 pointer-events-auto"
                            />
                        </Link>

                        <div className="flex items-center gap-8 text-[10px] uppercase tracking-widest text-[#5E5851]">
                            <Link href="#" className="hover:text-[var(--text-dark)] transition-colors">Facebook</Link>
                            <Link
                                href="https://instagram.com/oliviaalleppey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-[var(--text-dark)] transition-colors"
                            >
                                Instagram
                            </Link>
                        </div>

                        <p className="mt-5 text-[10px] uppercase tracking-widest text-[#5E5851] text-center">
                            © 2026 Olivia International. All Rights Reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
