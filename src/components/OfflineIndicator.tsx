import React, { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 99999,
            background: "var(--accent-1, #c97a7e)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            fontFamily: "var(--font-body), sans-serif",
            pointerEvents: "none" // Let clicks pass through
          }}
        >
          <WifiOff size={18} />
          <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>
            Mất kết nối Internet. Ứng dụng hiện đang ngoại tuyến.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
