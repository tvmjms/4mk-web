import Image from "next/image";

export default function SidebarNotes() {
  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl bg-white shadow-xl p-4 md:p-5">
        <div className="absolute -left-4 -top-4 rotate-3">
          <Image src="/img/lady-face-right.png" alt="Tips avatar" width={56} height={56} />
        </div>
        <div className="ml-10">
          <div className="text-base font-semibold text-neutral-900">Tips</div>
          <p className="mt-1 text-sm text-neutral-700">
            Use the search to find items like “blanket”, “ride”, “meals”.
          </p>
        </div>
      </div>

      <div className="relative rounded-2xl bg-white shadow-xl p-4 md:p-5">
        <div className="absolute -right-4 -top-4 -rotate-3">
          <Image src="/img/lady-face-left.png" alt="Safety avatar" width={56} height={56} />
        </div>
        <div className="mr-10">
          <div className="text-base font-semibold text-neutral-900">Safety</div>
          <p className="mt-1 text-sm text-neutral-700">
            Meet in public places and verify details before you go.
          </p>
        </div>
      </div>
    </div>
  );
}
