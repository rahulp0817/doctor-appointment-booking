import HomeMain from "@/components/HomeMain";
import Navbar from "@/components/Navbar";
import Image from "next/image";

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto flex flex-col gap-4 p-4 min-h-[92vh]">
      <Navbar />
      <HomeMain />
    </main>
  );
}
