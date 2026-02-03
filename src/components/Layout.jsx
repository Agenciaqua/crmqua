import React, { useState } from 'react';
import Sidebar from './Sidebar';
import AIChatWidget from './AIChatWidget';
import { Menu } from 'lucide-react';

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            overflow: 'hidden',
            padding: '20px',
            gap: '20px',
            position: 'relative'
        }}>
            {/* Mobile Menu Button */}
            <button
                className="mobile-menu-btn"
                onClick={() => setIsSidebarOpen(true)}
                style={{
                    position: 'absolute', top: '20px', left: '20px', zIndex: 100,
                    background: 'rgba(20,20,20,0.8)', border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)', color: 'white', padding: '10px', borderRadius: '12px',
                    display: 'none' // Hidden by default, shown via CSS on mobile
                }}
            >
                <Menu size={24} />
            </button>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main style={{
                flex: 1,
                overflowY: 'auto',
                position: 'relative',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 40px)'
            }}>
                {children}
            </main>
            <AIChatWidget />
        </div>
    );
};

export default Layout;
