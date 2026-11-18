import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'AI Engineering Platform | Demo', description: 'Evaluation-first AI engineering platform showcase' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
