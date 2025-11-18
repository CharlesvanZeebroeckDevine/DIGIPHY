import Link from "next/link";

const Links = [
    { href: "/contact", text: "Contact" },
];

import React from "react";

const Navbar = () => {
    return (
        <nav>
            <div>
                <Link href="/">Home</Link>
            </div>
            <ul>
                {
                    Links.map((link) => (
                        <li key={link.href}>
                            <Link href={link.href}>{link.text}</Link>
                        </li>
                    ))
                }
            </ul>
        </nav>
    )
};

export default Navbar;