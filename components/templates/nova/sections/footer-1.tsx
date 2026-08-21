import Link from 'next/link'

const Logo = ({ className }: { className?: string }) => (
    <svg
        className={`text-foreground h-5 w-auto ${className ?? ""}`}
        viewBox="0 0 108 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="logo">
        <rect x="0.75" y="0.75" width="26.5" height="26.5" rx="5.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7.5v13M8 14l6.5-6.5M8 14l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M34 7v14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M34 14.5l5-5.5M34 14.5l5.5 6.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M47 12c-2.21 0-4 1.79-4 4s1.79 4 4 4h3.5v-4c0-2.21-1.79-4-4-4z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50.5 12v9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <line x1="56" y1="12" x2="56" y2="21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="56" cy="9" r="1.1" fill="currentColor" />
        <path d="M61 12v9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M61 15c0-1.66 1.34-3 3-3h1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="73" cy="16.5" r="4" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="82" cy="20" r="1.2" fill="currentColor" opacity="0.4" />
        <path d="M87 12v6c0 1.66 1.34 3 3 3s3-1.34 3-3v-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.45" />
        <line x1="97" y1="12" x2="97" y2="21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.45" />
        <circle cx="97" cy="9" r="1.1" fill="currentColor" opacity="0.45" />
    </svg>
);

const links = {
    product: [
        { label: 'Features', href: '#' },
        { label: 'Integrations', href: '#' },
        { label: 'Pricing', href: '#' },
        { label: 'Changelog', href: '#' },
    ],
    company: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '#' },
    ],
    resources: [
        { label: 'Documentation', href: '#' },
        { label: 'Help Center', href: '#' },
        { label: 'Community', href: '#' },
        { label: 'Templates', href: '#' },
    ],
    legal: [
        { label: 'Privacy', href: '#' },
        { label: 'Terms', href: '#' },
        { label: 'Cookie Policy', href: '#' },
    ],
}

export default function Footer() {
    return (
        <footer className="bg-background @container border-t py-12">
            <div className="mx-auto max-w-2xl px-6">
                <div className="@sm:grid-cols-3 grid grid-cols-2 gap-8">
                    <div className="col-span-full">
                        <Link
                            href="/"
                            className="flex items-center gap-2">
                            <Logo className="h-5 w-fit" />
                        </Link>
                        <p className="text-muted-foreground mt-4 max-w-xs text-sm">Building the future of integrations. Connect your tools, automate your workflow.</p>
                    </div>
                    <div>
                        <h3 className="text-foreground mb-3 text-sm font-medium">Product</h3>
                        <ul className="space-y-2">
                            {links.product.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-foreground mb-3 text-sm font-medium">Company</h3>
                        <ul className="space-y-2">
                            {links.company.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-foreground mb-3 text-sm font-medium">Resources</h3>
                        <ul className="space-y-2">
                            {links.resources.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-8">
                    <p className="text-muted-foreground text-sm">&copy; {2026} Veil. All rights reserved.</p>
                    <div className="flex gap-4">
                        {links.legal.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
