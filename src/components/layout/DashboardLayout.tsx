import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAppSelector } from "@/store/hooks";

export default function DashboardLayout() {
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <motion.main
        animate={{ paddingLeft: sidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="min-h-screen pt-16"
      >
        <div className="p-6">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
}
