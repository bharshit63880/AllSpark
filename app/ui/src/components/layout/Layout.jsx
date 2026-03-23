import React from "react";
import Header from "./header/Header";
import Footer from "./footer/Footer";

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen overflow-x-hidden">
            <Header />
            <main className="min-h-[60vh]">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
