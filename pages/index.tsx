// pages/index.tsx
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import NeedList from "@/components/NeedList";
import SidebarNotes from "@/components/SidebarNotes";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>All Needs — 4MK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Outer app background */}
      <div className="min-h-screen bg-[#373737] py-8 px-3">
        {/* Invitation card with gold rim */}
        <div className="mx-auto max-w-6xl rounded-[28px] bg-gradient-to-b from-pink-200 to-pink-300 p-6 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.35)] ring-2 ring-[#DBB35D]" >
          {/* Hero */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900">Welcome to 4MK</h1>
              <p className="mt-2 text-neutral-700">
                Find needs in your community or post one of your own.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/needs" className="rounded-full bg-[#5b8762] text-white px-5 py-2 shadow hover:opacity-90">View All Needs</Link>
                <Link href="/dashboard" className="rounded-full bg-[#5b8762] text-white px-5 py-2 shadow hover:opacity-90">My Dashboard</Link>
                <Link href="/needs/create" className="rounded-full bg-[#5b8762] text-white px-5 py-2 shadow hover:opacity-90">Create Need</Link>
              </div>
            </div>

            <div className="justify-self-center md:justify-self-end">
              <Image
                src="/img/heartlady-center.png"
                alt="Heart lady"
                width={180}
                height={180}
                priority
              />
            </div>
          </div>

          {/* Main layout */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Needs panel */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl bg-[#6B5E5E]/90 p-3 md:p-4 shadow-xl">
                <div className="rounded-2xl bg-[#ef9f9f]/35 p-2 md:p-3 shadow">
                  <NeedList scope="all" pageSize={6} />
                </div>
              </div>
            </div>

            {/* Tips / Safety */}
            <div>
              <SidebarNotes />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
