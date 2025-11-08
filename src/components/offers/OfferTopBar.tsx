 import Image from "next/image";

type Props = {
  offerNumber: string;
  customerNumber?: string;
  status?: string;
};

export default function TopBarOffer({ offerNumber, customerNumber = "—", status = "inkommen" }: Props) {
  return (
    <div className="w-full" style={{ backgroundColor: "#1D2937" }}>
      <div className="mx-auto max-w-4xl px-6 py-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/busie.png" alt="Busie" width={28} height={28} priority />
          <div className="text-sm leading-tight">
            <div className="opacity-80">Offert</div>
            <div className="font-semibold">Nr {offerNumber}</div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="opacity-80 mr-1">Kundnr:</span>
            <span className="font-medium">{customerNumber}</span>
          </div>
          <div className="hidden sm:block">
            <span className="opacity-80 mr-1">Status:</span>
            <span className="font-medium capitalize">{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
