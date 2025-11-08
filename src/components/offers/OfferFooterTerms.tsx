type Props = {
  termsParagraphs: string[];
  companyName: string;
  address1: string;
  address2: string;
  website: string;
  phoneMain: string;
  phoneEmergency: string;
  email: string;
  bankgiro: string;
  orgNumber: string;
  vatNumber: string;
  bankName: string;
  iban: string;
  bic: string;
};

export default function OfferFooterTerms(p: Props) {
  return (
    <>
      <div className="mt-7 text-[14px] text-[#0f172a]/70" style={{ lineHeight: 1.5 }}>
        {p.termsParagraphs.map((t, i) => (
          <p key={i} className={i ? "mt-3" : ""}>{t}</p>
        ))}
      </div>

      <div
        className="mt-5 grid gap-2 text-xs text-[#0f172a]/60 sm:grid-cols-2 lg:grid-cols-4"
        style={{ lineHeight: 1.5 }}
      >
        <div>
          <div>{p.companyName}</div>
          <div>{p.address1}</div>
          <div>{p.address2}</div>
          <div>{p.website}</div>
        </div>
        <div>
          <div>Tel. {p.phoneMain}</div>
          <div>Jour: {p.phoneEmergency}</div>
          <div>{p.email}</div>
        </div>
        <div>
          <div>Bankgiro: {p.bankgiro}</div>
          <div>Org.nr: {p.orgNumber}</div>
          <div>VAT nr: {p.vatNumber}</div>
        </div>
        <div>
          <div>{p.bankName}</div>
          <div>IBAN: {p.iban}</div>
          <div>Swift/BIC: {p.bic}</div>
        </div>
      </div>
    </>
  );
}
