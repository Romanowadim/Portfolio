"use client";

import { motion } from "framer-motion";
import OrderForm from "@/components/order/OrderForm";

export default function OrderPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col pb-10 lg:pb-6 overflow-y-auto"
    >
      <OrderForm />
    </motion.div>
  );
}
