import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function SiteLayout() {
  const location = useLocation();

  const isHome = location.pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      {/*
        HOME:
        Navbar is absolute over the hero, so no top spacing is needed.

        OTHER PAGES:
        Navbar is sticky and remains in the normal document flow,
        so we do NOT add padding-top here.
      */}
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}