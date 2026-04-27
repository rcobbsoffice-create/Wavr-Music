import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import MerchCard from "@/components/MerchCard";
import ProfileBeatsClient from "./ProfileBeatsClient";

// Public Producer Profile Page
export default async function ProducerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch producer info, their active beats, and their merch
  const producer = await prisma.user.findUnique({
    where: { id },
    include: {
      beats: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
      },
      merchProducts: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!producer || producer.role !== "producer") {
    notFound();
  }

  const themeColors: Record<string, string> = {
    purple: "from-fuchsia-900/40 via-purple-900/20",
    blue: "from-blue-900/40 via-cyan-900/20",
    red: "from-red-900/40 via-orange-900/20",
    green: "from-emerald-900/40 via-green-900/20",
    gray: "from-gray-800/40 via-gray-900/20",
    "crimson-nights": "from-[#D7263D]/40 via-[#02182B]/80",
    "cyber-yellow": "from-[#FFCD00]/30 via-[#3D474E]/80",
    "neon-blue": "from-[#0ECCED]/30 via-[#020764]/80",
  };
  const bgColors: Record<string, string> = {
    purple: "bg-gray-950",
    blue: "bg-gray-950",
    red: "bg-gray-950",
    green: "bg-gray-950",
    gray: "bg-gray-950",
    "crimson-nights": "bg-[#02182B]",
    "cyber-yellow": "bg-[#192230]",
    "neon-blue": "bg-[#030812]",
  };
  
  const selectedTheme = producer.themeColor || "purple";
  const themeClasses = themeColors[selectedTheme] || themeColors.purple;
  const bgClass = bgColors[selectedTheme] || bgColors.purple;

  return (
    <div className={`min-h-screen ${bgClass} pb-20 transition-colors duration-500`}>
      {/* Cover / Header */}
      <div 
        className={`relative bg-gradient-to-br ${themeClasses} ${selectedTheme.includes('-') ? '' : 'to-gray-900'} border-b border-gray-800 pt-32 pb-16`}
        style={producer.coverImage ? {
          backgroundImage: `linear-gradient(to bottom right, rgba(0,0,0,0.4), rgba(17,24,39,0.9)), url(${producer.coverImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-800 border-4 border-gray-900 shadow-xl overflow-hidden shrink-0 flex items-center justify-center">
              {producer.avatar ? (
                <Image src={producer.avatar} alt={producer.name} width={160} height={160} className="object-cover w-full h-full" />
              ) : (
                <span className="text-4xl text-gray-500 font-bold">{producer.name.charAt(0).toUpperCase()}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left mt-2 md:mt-4">
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">{producer.name}</h1>
              {producer.bio ? (
                <p className="text-gray-400 mt-4 max-w-2xl text-sm md:text-base leading-relaxed">
                  {producer.bio}
                </p>
              ) : (
                <p className="text-gray-500 mt-4 text-sm italic">This producer hasn't added a bio yet.</p>
              )}
              
              <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                <button className="bg-white text-black hover:bg-gray-200 font-bold px-6 py-2 rounded-full text-sm transition-colors">
                  Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">
        
        {/* Beats Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Beats by {producer.name}</h2>
          </div>
          
          <ProfileBeatsClient 
            beats={producer.beats.map((beat) => ({
              ...beat,
              producer: producer.name,
              tags: (() => { try { return JSON.parse(beat.tags); } catch { return []; } })(),
            }))} 
          />
        </section>

        {/* Merch Section */}
        {producer.merchProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Exclusive Merch</h2>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {producer.merchProducts.map((product) => (
                <MerchCard key={product.id} item={product} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
