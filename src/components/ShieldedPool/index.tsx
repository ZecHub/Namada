"use client";

// import dynamic from "next/dynamic";
import Dashboard from "../Charts";

// const ShieldedPoolDashboard = dynamic(() => import("./ShieldedPoolDashboard"), {
//   ssr: false,
//   loading: () => <span className="text-center text-3xl">Loading...</span>,
// });

export default function ClientDashboard() {
  // return <ShieldedPoolDashboard />;
  return <Dashboard />;
}
