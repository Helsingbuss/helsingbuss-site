import Image from "next/image";

export default function TravelFeelingSection() {
  return (
    <section className="hb-feel">
      <div className="hb-feel__inner">
        <div className="hb-feel__card">
          <div className="hb-feel__media">
            <Image
              src="/box_girls_.jpeg"
              alt="Res med Helsingbuss"
              fill
              sizes="(max-width: 900px) 100vw, 520px"
              className="hb-feel__img"
              priority
            />
          </div>

          <div className="hb-feel__content">
            <h2 className="hb-feel__title">
              Från Helsingborg till upplevelsen – bussresor som är för alla!
            </h2>

            <p className="hb-feel__text">
              Helsingbuss är ett nytt bussbolag med en enkel idé: resan ska kännas trygg, smidig och riktigt trevlig  oavsett om ni ska på företagsevent, cup, shoppingresa eller en helg med vännerna. Vi kör för företag, föreningar, skolor och grupper som vill resa tillsammans utan krångel.
            </p>

            <p className="hb-feel__text">
              Även om varumärket är nytt står vi på branscherfarenhet och samarbetar med etablerade bussföretag. Det betyder moderna bussar, seriösa förare och planering som håller  så att tidsplan, stopp och helhetskänsla sitter från start.
            </p>

            <p className="hb-feel__text">
              Ni berättar vad ni vill uppleva. Vi tar hand om vägen dit  och ser till att resan blir en trygg del av upplevelsen, inte bara transporten.
            </p>
            <div className="hb-feel__actions">
              <a className="hb-feel__btn" href="/boka">Till offertförfrågan</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
