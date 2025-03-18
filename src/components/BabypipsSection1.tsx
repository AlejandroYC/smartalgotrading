import React from 'react';
import { FaRegClock } from 'react-icons/fa';
import Image from 'next/image';

const BabypipsSectionsAfterHero: React.FC = () => {
  return (
    <div className="bg-white">
      {/* ===================== PARTE 1 ===================== */}
      {/* 
        - Izquierda (2 artículos grandes arriba + lista de artículos pequeños abajo)
        - Derecha (2 tarjetas: "Forex Market Hours Tool" y "Economic Calendar")
      */}
      <section>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Artículo 1 (col 1) */}
            <article className="rounded-md shadow-sm">
              {/* Contenedor relativo para la imagen y el span */}
              <div className="relative">
                <Image
                  src="https://bpcdn.co/images/2022/01/28203027/weekly-fx-market-recap-final-360x188.png"
                  alt="Weekly FX Market Recap"
                  layout="responsive"
                  width={360}
                  height={188}
                  className="border border-gray-500"
                />
                <span className="absolute bottom-0 left-0 bg-[#28bc26ed] text-white text-xs font-semibold px-4 py-2">
                  ANALYSIS
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mt-4 mb-2">
                FX Weekly Recap: March 3 - 7, 2025
              </h3>
              {/* Bloque con ícono y fecha */}
              <div className="flex items-center text-xs text-gray-500 mb-2">
                <FaRegClock className="mr-1" />
                <span>March 3, 2025 - 10:00 AM</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                It was a jam-packed trading week as top-tier economic data, an ECB rate cut,
                escalating trade tensions, and Trump’s accusations of currency manipulation
                fueled volatility across FX markets.
              </p>
            </article>

            {/* Artículo 2 */}
            <article className="rounded-md shadow-sm">
              <div className="relative">
                <Image
                  src="https://bpcdn.co/images/2023/04/21171221/weekly-intermarket-recap-360x188.png"
                  alt="Global Market Weekly Recap"
                  layout="responsive"
                  width={360}
                  height={188}
                  className="border border-gray-500"
                />
                <span className="absolute bottom-0 left-0 bg-[#28bc26ed] text-white text-xs font-semibold px-4 py-2">
                  NEWS
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mt-4 mb-2">
                Global Market Weekly Recap: March 3 - 7, 2025
              </h3>
              {/* Bloque con ícono y fecha */}
              <div className="flex items-center text-xs text-gray-500 mb-2">
                <FaRegClock className="mr-1" />
                <span>March 3, 2025 - 09:00 AM</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                The start of higher U.S. tariffs on Canada and Mexico weighed heavily on the market mood
                early in the week, before Trump agreed to postpone some trade levies later on. But why
                didn’t the risk rallies last?
              </p>
            </article>
          </div>

          {/* Siguiente fila: artículos pequeños a la izquierda, Economic Calendar a la derecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 mt-6">
            {/* Artículo 1 */}
            <article className="rounded-md shadow-sm p-2 flex space-x-3">
              <Image
                src="https://bpcdn.co/images/2025/03/11092626/FX-Watch-nzdcad-cadchf-blue-360x188.png"
                alt="Miniatura 1"
                width={112}
                height={62}
                className="w-[112px] h-[62px] object-cover border border-gray-200" 
              />
              <div>
                {/* Etiqueta / categoría */}
                <span className="text-[8px] font-semibold text-white uppercase bg-[#444951] pt-[5px] pr-[10px] pb-[4px] pl-[10px]">
                  ANÁLISIS
                </span>
                {/* Título */}
                <h4 className="text-sm text-gray-800 mt-1">
                  FX Watch: NZD/CAD and CAD/CHF Trend Setups for a Dovish BOC Decision
                </h4>
                {/* Fecha */}
                <p className="text-xs text-gray-500 mt-1">5 days ago</p>
              </div>
            </article>

            {/* Artículo 2 */}
            <article className="rounded-md shadow-sm p-2 flex space-x-3">
              <Image
                src="https://bpcdn.co/images/2024/09/03103559/boc-policy-statement-2024-360x187.png"
                alt="Miniatura 2"
                width={112}
                height={62}
                className="w-[112px] h-[62px] object-cover border border-gray-200" 
              />
              <div>
                <span className="text-[8px] font-semibold text-white uppercase bg-[#444951] pt-[5px] pr-[10px] pb-[4px] pl-[10px]">
                  ANÁLISIS
                </span>
                <h4 className="text-sm text-gray-800 mt-1">
                  Event Guide: BOC Monetary Policy Statement (March 2025)
                </h4>
                <p className="text-xs text-gray-500 mt-1">4 days ago</p>
              </div>
            </article>

            {/* Artículo 3 */}
            <article className="rounded-md shadow-sm p-2 flex space-x-3">
              <Image
                src="https://bpcdn.co/images/2023/05/08094711/us-cpi-report-2023-360x187.png"
                alt="Miniatura 3"
                width={112}
                height={62}
                className="w-[112px] h-[62px] object-cover border border-gray-200" 
              />
              <div>
                <span className="text-[8px] font-semibold text-white uppercase bg-[#444951] pt-[5px] pr-[10px] pb-[4px] pl-[10px]">
                  NEWS
                </span>
                <h4 className="text-sm text-gray-800 mt-1">
                  Event Guide: U.S. CPI Report (February 2025)
                </h4>
                <p className="text-xs text-gray-500 mt-1">3 days ago</p>
              </div>
            </article>

            {/* Artículo 4 */}
            <article className="rounded-md shadow-sm p-2 flex space-x-3">
              <Image
                src="https://bpcdn.co/images/2025/03/11092435/Market-Recap-2025-03-10-360x187.png"
                alt="Miniatura 4"
                width={112}
                height={62}
                className="w-[112px] h-[62px] object-cover border border-gray-200" 
              />
              <div>
                <span className="text-[8px] font-semibold text-white uppercase bg-[#444951] pt-[5px] pr-[10px] pb-[4px] pl-[10px]">
                  NEWS
                </span>
                <h4 className="text-sm text-gray-800 mt-1">
                  Daily Broad Market Recap - February 28, 2025
                </h4>
                <p className="text-xs text-gray-500 mt-1">2 days ago</p>
              </div>
            </article>

            {/* Artículo 5 */}
            <article className="rounded-md shadow-sm p-2 flex space-x-3">
              <Image
                src="https://bpcdn.co/images/2020/11/30184535/Traders-Block-HP-360x188.png"
                alt="Miniatura 5"
                width={112}
                height={62}
                className="w-[112px] h-[62px] object-cover border border-gray-200" 
              />
              <div>
                <span className="text-[8px] font-semibold text-white uppercase bg-[#444951] pt-[5px] pr-[10px] pb-[4px] pl-[10px]">
                  PSYCHOLOGY
                </span>
                <h4 className="text-sm text-gray-800 mt-1">
                  What Is Traders Block? And How to Overcome It
                </h4>
                <p className="text-xs text-gray-500 mt-1">2 days ago</p>
              </div>
            </article>

            {/* Artículo 6 */}
            <article className="rounded-md shadow-sm p-2 flex space-x-3">
              <Image
                src="https://bpcdn.co/images/2025/01/27133305/FX-Fundies-Cheat-Sheet-360x187.png"
                alt="Miniatura 6"
                width={112}
                height={62}
                className="w-[112px] h-[62px] object-cover border border-gray-200" 
              />
              <div>
                <span className="text-[8px] font-semibold text-white uppercase bg-[#444951] pt-[5px] pr-[10px] pb-[4px] pl-[10px]">
                  ANÁLISIS
                </span>
                <h4 className="text-sm text-gray-800 mt-1">
                  X Fundies Cheat Sheet for March 1, 2025
                </h4>
                <p className="text-xs text-gray-500 mt-1">1 day ago</p>
              </div>
            </article>

            {/* Artículo 7 */}
            <article className="rounded-md shadow-sm p-2 flex space-x-3">
              <Image
                src="https://bpcdn.co/images/2025/03/10093946/Premium-Recap-2025-03-04-360x187.png"
                alt="Miniatura 7"
                width={112}
                height={62}
                className="w-[112px] h-[62px] object-cover border border-gray-200" 
              />
              <div>
                <span className="text-[8px] font-semibold text-white uppercase bg-[#444951] pt-[5px] pr-[10px] pb-[4px] pl-[10px]">
                  PSYCHOLOGY
                </span>
                <h4 className="text-sm text-gray-800 mt-1">
                  Premium Watchlist Recap: March 1, 2025
                </h4>
                <p className="text-xs text-gray-500 mt-1">5 days ago</p>
              </div>
            </article>

            {/* Artículo 8 */}
            <article className="rounded-md shadow-sm p-2 flex space-x-3">
              <Image
                src="https://bpcdn.co/images/2024/08/16152250/chart-art-eurgbp-eur-360x188.png"
                alt="Miniatura 8"
                width={112}
                height={62}
                className="w-[112px] h-[62px] object-cover border border-gray-200" 
              />
              <div>
                <span className="text-[8px] font-semibold text-white uppercase bg-[#444951] pt-[5px] pr-[10px] pb-[4px] pl-[10px]">
                  ANÁLISIS
                </span>
                <h4 className="text-sm text-gray-800 mt-1">
                  FX Weekly Recap: February 28, 2025
                </h4>
                <p className="text-xs text-gray-500 mt-1">4 days ago</p>
              </div>
            </article>

            {/* Artículo 9 */}
            <article className="rounded-md shadow-sm p-2 flex space-x-3">
              <Image
                src="https://bpcdn.co/images/2022/01/28203027/weekly-fx-market-recap-final-360x188.png"
                alt="Miniatura 9"
                width={112}
                height={62}
                className="w-[112px] h-[62px] object-cover border border-gray-200" 
              />
              <div>
                <span className="text-[8px] font-semibold text-white uppercase bg-[#444951] pt-[5px] pr-[10px] pb-[4px] pl-[10px]">
                  ANÁLISIS
                </span>
                <h4 className="text-sm text-gray-800 mt-1">
                  Chart Art: EUR/GBP - Approaching Range Resistance
                </h4>
                <p className="text-xs text-gray-500 mt-1">3 days ago</p>
              </div>
            </article>

            {/* Artículo 10 */}
            <article className="rounded-md shadow-sm p-2 flex space-x-3">
              <Image
                src="https://bpcdn.co/images/2023/04/21171221/weekly-intermarket-recap-360x188.png"
                alt="Miniatura 10"
                width={112}
                height={62}
                className="w-[112px] h-[62px] object-cover border border-gray-200" 
              />
              <div>
                <span className="text-[8px] font-semibold text-white uppercase bg-[#444951] pt-[5px] pr-[10px] pb-[4px] pl-[10px]">
                  NEWS
                </span>
                <h4 className="text-sm text-gray-800 mt-1">
                  Global Market Weekly Recap: March 1 - 7, 2025
                </h4>
                <p className="text-xs text-gray-500 mt-1">2 days ago</p>
              </div>
            </article>

            {/* Artículo 11 */}
            <article className="rounded-md shadow-sm p-2 flex space-x-3">
              <Image
                src="https://bpcdn.co/images/2021/02/24181436/Winning-Big-HP-360x188.png"
                alt="Miniatura 11"
                width={112}
                height={62}
                className="w-[112px] h-[62px] object-cover border border-gray-200" 
              />
              <div>
                <span className="text-[8px] font-semibold text-white uppercase bg-[#444951] pt-[5px] pr-[10px] pb-[4px] pl-[10px]">
                  PSYCHOLOGY
                </span>
                <h4 className="text-sm text-gray-800 mt-1">
                  5 Points to Keep You Level-Headed When Youre Winning Big
                </h4>
                <p className="text-xs text-gray-500 mt-1">1 day ago</p>
              </div>
            </article>

            {/* Artículo 12 */}
            <article className="rounded-md shadow-sm p-2 flex space-x-3">
              <Image
                src="https://bpcdn.co/images/2025/03/05205922/Market-Recap-2025-03-06-360x187.png"
                alt="Miniatura 12"
                width={112}
                height={62}
                className="w-[112px] h-[62px] object-cover border border-gray-200" 
              />
              <div>
                <span className="text-[8px] font-semibold text-white uppercase bg-[#444951] pt-[5px] pr-[10px] pb-[4px] pl-[10px]">
                  NEWS
                </span>
                <h4 className="text-sm text-gray-800 mt-1">
                  Broad Market Recap - March 6, 2025
                </h4>
                <p className="text-xs text-gray-500 mt-1">6 hours ago</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="relative bg-[#f4f4f4] rounded-md shadow-md p-6 md:p-8 max-w-5xl mx-auto mt-10">
  
  <span class="absolute top-0 right-0 bg-[#ea0075] text-white text-xs font-bold uppercase px-3 py-1 rounded-bl-md z-10">
    NEW! from babypips
  </span>

  
  <div class="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-6">
    
    <div class="flex-1">
      <h2 class="text-2xl md:text-3xl font-extrabold text-[#6b33b3] mb-4">
        Meet MarketMilk™
      </h2>
      <p class="text-gray-700 text-sm md:text-base leading-relaxed mb-4">
        Designed for new and developing traders, 
        <strong class="font-semibold">MarketMilk™</strong> is a
        <strong class="font-semibold">visual technical analysis tool</strong>
        that simplifies the process of analyzing market data to help
        forex and crypto traders make better trading decisions.
      </p>

      
      <div class="flex items-center space-x-4 mb-6">
        <div class="flex flex-col items-center">
          <img
            src="forex-market.svg"
            alt="Forex Market"
            class="w-12 h-12 object-contain"
          />
          <span class="bg-blue-600 text-white text-[12px] font-semibold px-1 py-1 rounded-md hover:bg-blue-700 transition mt-[10px]">
            FOREX MARKET
          </span> 
        </div>
        <div class="flex flex-col items-center">
          <img
            src="plus-signal.svg"
            alt="Plus Signal"
            className="w-12 h-10 object-contain"
          />
            
            
        </div>
        <div class="flex flex-col items-center">
          <img
            src="crypto-market.svg"
            alt="Crypto Market"
            className="w-12 h-12 object-contain"
          />
          <span class="bg-blue-600 text-white text-[12px] font-semibold px-1 py-1 rounded-md hover:bg-blue-700 transition mt-[10px]">
            CRYPTO MARKET
          </span>
        </div>
      </div>

     
      <a
        href="#"
        class="inline-block bg-purple-600 text-white text-sm font-semibold px-6 py-3 rounded-md hover:bg-purple-700 transition"
      >
        Explore MarketMilk™
      </a>
    </div>

    
    <div class="w-full md:w-1/2 flex justify-center">
      <img
        src="https://bpcdn.co/packs/media/images/e217bd5ab2416eaf83d1.webp"
        alt="MarketMilk Mascot"
        class="max-w-full h-auto object-contain"
      />

      
    </div>
    
  </div>

  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
   
    <div class="flex items-start space-x-3">
      <img
        src="forex-market-snap.svg"
        alt="Icon 1"
        class="w-8 h-8 object-contain"
      />
      <div>
        <h4 class="text-sm font-bold text-gray-800">
          FOREX MARKET SNAPSHOT
        </h4>
        <p class="text-xs text-gray-700 mt-1">
          Get a quick overview of the forex market situation today.
        </p>
      </div>
    </div>

    <div class="flex items-start space-x-3">
      <img
        src="forex-market-snap.svg"
        alt="Icon 2"
        class="w-8 h-8 object-contain"
      />
      <div>

        <h4 class="text-sm font-bold text-gray-800">
        CRYPTO MARKET SNAPSHOT
        </h4>
        <p class="text-xs text-gray-700 mt-1">
        See which cryptocurrencies are on the move right now.
        </p>
      </div>
    </div>
    
    <div class="flex items-start space-x-3">
      <img
        src="currency-strength.svg"
        alt="Icon 2"
        class="w-8 h-8 object-contain"
      />
      <div>
        <h4 class="text-sm font-bold text-gray-800">
          CURRENCY STRENGTH
        </h4>
        <p class="text-xs text-gray-700 mt-1">
        Identify which currencies are strong and which currencies are weak
        </p>
      </div>
    </div>


   
    <div class="flex items-start space-x-3">
      <img
        src="currency-strength.svg"
        alt="Icon 3"
        className="w-8 h-8 object-contain"
      />
      <div>
        <h4 class="text-sm font-bold text-gray-800">
        CRYPTOCURRENCY STRENGTH
        </h4>
        <p class="text-xs text-gray-700 mt-1">
        Discover which cryptos are dominating today’s market.
        </p>
      </div>
    </div>

    
    <div class="flex items-start space-x-3">
      <img
        src="currency-volatility.svg"
        alt="Icon 4"
        class="w-8 h-8 object-contain"
      />
      <div>
        <h4 class="text-sm font-bold text-gray-800">
        CURRENCY VOLATILITY
        </h4>
        <p class="text-xs text-gray-700 mt-1">
        Monitor the volatility of all 8 major currencies in the forex market.
        </p>
      </div>
    </div>

    
    <div class="flex items-start space-x-3">
      <img
        src="currency-volatility.svg"
        alt="Icon 5"
        className="w-8 h-8 object-contain"
      />
      <div>
        <h4 class="text-sm font-bold text-gray-800">
        CRYPTOCURRENCY VOLATILITY
        </h4>
        <p class="text-xs text-gray-700 mt-1">
        Monitor the volatility of major cryptocurrencies.
        </p>
      </div>
    </div>

    
    <div class="flex items-start space-x-3">
      <img
        src="market-movers.svg"
        alt="Icon 6"
        class="w-8 h-8 object-contain"
      />
      <div>
        <h4 class="text-sm font-bold text-gray-800">
        TOP FOREX MARKET MOVERS
        </h4>
        <p class="text-xs text-gray-700 mt-1">
        See which currency pairs have gone up or down significantly today.
        </p>
      </div>
    </div>
    <div class="flex items-start space-x-3">
      <img
        src="market-movers.svg"
        alt="Icon 6"
        class="w-8 h-8 object-contain"
      />
      <div>
        <h4 class="text-sm font-bold text-gray-800">
        TOP CRYPTO MARKET MOVERS
        </h4>
        <p class="text-xs text-gray-700 mt-1">
        See which crypto pairs have gone up or down significantly today.
        </p>
      </div>
    </div>
    <div class="flex items-start space-x-3">
      <img
        src="heat-map.svg"
        alt="Icon 6"
        class="w-8 h-8 object-contain"
      />
      <div>
        <h4 class="text-sm font-bold text-gray-800">
        CURRENCY HEAT MAP
        </h4>
        <p class="text-xs text-gray-700 mt-1">
        A visual tool showing price action of major currencies across multiple timeframes.
        </p>
      </div>
    </div>
    <div class="flex items-start space-x-3">
      <img
        src="heat-map.svg"
        alt="Icon 6"
        class="w-8 h-8 object-contain"
      />
      <div>
        <h4 class="text-sm font-bold text-gray-800">
          CRYPTO HEAT MAP
        </h4>
        <p class="text-xs text-gray-700 mt-1">
          Visualize the market changes for your favorite cryptos.
        </p>
      </div>
    </div>
  </div>
</section>



     
    </div>
  );
};

export default BabypipsSectionsAfterHero;
