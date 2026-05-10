import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import TabBar from "./TabBar";

const Layout = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <Navbar />
    <main className="flex-1 pt-14 sm:pt-16 pb-20 md:pb-0">
      <Outlet />
    </main>
    <Footer />
    <TabBar />
  </div>
);

export default Layout;
