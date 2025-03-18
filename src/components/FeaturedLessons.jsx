import Image from 'next/image';

const FeaturedLessons = () => {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6  py-12">
        <h2 className="text-center text-4xl font-bold text-gray-800 mb-12">
          Featured Lessons
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Psychological Levels Card */}
            <article className="rounded-md shadow-sm">
                        {/* Contenedor relativo para la imagen y el span */}
                        <div className="relative">
                          <Image
                            src="https://bpcdn.co/images/2023/05/17162849/what-are-psychological-levels-360x188.png"
                            alt="Weekly FX Market Recap"
                            layout="responsive"
                            width={360}
                            height={188}
                            className="border border-gray-500"
                          />
                    
                        </div>
                        <h3 className="text-[21px] font-bold text-gray-800 mt-4 mb-2">
                        Psychological Levels
                        </h3>
                        {/* Bloque con ícono y fecha */}
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                        
                       
                        </div>
                        <p className="text-[16px] text-gray-700 mb-2">
                        Learn about these “invisible lines” that can act as support or resistance levels because so many traders are watching them.
                        </p>
                      </article>
  
          {/* Bollinger Bands Card */}
          <article className="rounded-md shadow-sm">
                        {/* Contenedor relativo para la imagen y el span */}
                        <div className="relative">
                          <Image
                            src="https://bpcdn.co/images/2011/02/27183526/How-to-Use-Bollinger-Bands-360x188.png"
                            alt="Weekly FX Market Recap"
                            layout="responsive"
                            width={360}
                            height={188}
                            className="border border-gray-500"
                          />
                       
                        </div>
                        <h3 className="text-[21px]  font-bold text-gray-800 mt-4 mb-2">
                        How to Use Bollinger Bands
                        </h3>
                        {/* Bloque con ícono y fecha */}
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                        

                        </div>
                        <p className="text-[16px] text-gray-700 mb-2">
                        What better way to start building up your trading toolbox than by reading up on Bollinger Bands!
                        </p>
                      </article>
  
  
          {/* Heikin Ashi Card */}
          <article className="rounded-md shadow-sm">
                        {/* Contenedor relativo para la imagen y el span */}
                        <div className="relative">
                          <Image
                            src="https://bpcdn.co/images/2020/04/18152246/What-is-Heiken-Ashi-360x188.png"
                            alt="Weekly FX Market Recap"
                            layout="responsive"
                            width={360}
                            height={188}
                            className="border border-gray-500"
                          />
                    
                        </div>
                        <h3 className="text-[21px]  font-bold text-gray-800 mt-4 mb-2">
                        What is Heikin Ashi?
                        </h3>
                        {/* Bloque con ícono y fecha */}
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                        

                        </div>
                        <p className="text-[16px] text-gray-700 mb-2">
                        Learn what Heikin Ashi is and how this trendy candlestick chart can help traders who like their prices smooth.
                        </p>
                      </article>

                      <article className="rounded-md shadow-sm">
                        {/* Contenedor relativo para la imagen y el span */}
                        <div className="relative">
                          <Image
                            src="https://bpcdn.co/images/2011/03/14153140/Types-of-Market-Analysis-Best-360x188.png"
                            alt="Weekly FX Market Recap"
                            layout="responsive"
                            width={360}
                            height={188}
                            className="border border-gray-500"
                          />
                    
                        </div>
                        <h3 className="text-[21px]  font-bold text-gray-800 mt-4 mb-2">
                        Which Type of Analysis for Forex Trading is Best?
                        </h3>
                        {/* Bloque con ícono y fecha */}
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                        

                        </div>
                        <p className="text-[16px] text-gray-700 mb-2">
                        Discover the best type of analysis for trading—technical, fundamental, or sentiment. Learn how each approach works and which is best suited to your trading style.
                        </p>
                      </article>
  
          {/* Bollinger Bands Card */}
          <article className="rounded-md shadow-sm">
                        {/* Contenedor relativo para la imagen y el span */}
                        <div className="relative">
                          <Image
                            src="https://bpcdn.co/images/2021/04/07162844/five-deadly-os-of-trading-360x188.png"
                            alt="Weekly FX Market Recap"
                            layout="responsive"
                            width={360}
                            height={188}
                            className="border border-gray-500"
                          />
                       
                        </div>
                        <h3 className="text-[21px]  font-bold text-gray-800 mt-4 mb-2">
                        The 5 Deadly O’s of Trading: What Traders Do To Guarantee Their Own Failure
                        </h3>
                        {/* Bloque con ícono y fecha */}
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                        

                        </div>
                        <p className="text-[16px] text-gray-700 mb-2">
                        The 5 O’s of trading are fatal for traders. Your success depends on avoiding these mistakes. Learn what they are before it’s too late and you end up blowing your account!
                        </p>
                      </article>
  
  
          {/* Heikin Ashi Card */}
          <article className="rounded-md shadow-sm">
                        {/* Contenedor relativo para la imagen y el span */}
                        <div className="relative">
                          <Image
                            src="https://bpcdn.co/images/2010/10/16163559/The-Dollar-Smille-Theory-360x188.png"
                            alt="Weekly FX Market Recap"
                            layout="responsive"
                            width={360}
                            height={188}
                            className="border border-gray-500"
                          />
                    
                        </div>
                        <h3 className="text-[21px]  font-bold text-gray-800 mt-4 mb-2">
                        The Dollar Smile Theory
                        </h3>
                        {/* Bloque con ícono y fecha */}
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                        

                        </div>
                        <p className="text-[16px] text-gray-700 mb-2">
                        Have you ever wondered why the dollar rallies in the good times and in the bad? Smile! You’re about to find out why.
                        </p>
                      </article>

                      <article className="rounded-md shadow-sm">
                        {/* Contenedor relativo para la imagen y el span */}
                        <div className="relative">
                          <Image
                            src="https://bpcdn.co/images/2025/03/11200820/how-major-central-banks-influence-the-forex-market-360x187.png"
                            alt="Weekly FX Market Recap"
                            layout="responsive"
                            width={360}
                            height={188}
                            className="border border-gray-500"
                          />
                    
                        </div>
                        <h3 className="text-[21px]  font-bold text-gray-800 mt-4 mb-2">
                        How Major Central Banks Influence the Forex Market
                        </h3>
                        {/* Bloque con ícono y fecha */}
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                        

                        </div>
                        <p className="text-[16px] text-gray-700 mb-2">
                        Discover how central banks like the Fed, BoJ, BoE, BoC, PBOC, RBA, RBNZ, and SNB drive forex market movements.
                        </p>
                      </article>
  
          {/* Bollinger Bands Card */}
          <article className="rounded-md shadow-sm">
                        {/* Contenedor relativo para la imagen y el span */}
                        <div className="relative">
                          <Image
                            src="https://bpcdn.co/images/2021/06/09151209/how-do-forex-brokers-work-360x188.png"
                            alt="Weekly FX Market Recap"
                            layout="responsive"
                            width={360}
                            height={188}
                            className="border border-gray-500"
                          />
                       
                        </div>
                        <h3 className="text-[21px]  font-bold text-gray-800 mt-4 mb-2">
                        How Do Forex Brokers Work?
                        </h3>
                        {/* Bloque con ícono y fecha */}
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                        

                        </div>
                        <p className="text-[16px] text-gray-700 mb-2">
                        How do forex brokers work? Here’s a story that helps explain what forex brokers actually do.
                        </p>
                      </article>
  
  
          {/* Heikin Ashi Card */}
          <article className="rounded-md shadow-sm">
                        {/* Contenedor relativo para la imagen y el span */}
                        <div className="relative">
                          <Image
                            src="https://bpcdn.co/images/2018/07/26192337/What-is-Forex-School-Lesson-360x188.png"
                            alt="Weekly FX Market Recap"
                            layout="responsive"
                            width={360}
                            height={188}
                            className="border border-gray-500"
                          />
                    
                        </div>
                        <h3 className="text-[21px]  font-bold text-gray-800 mt-4 mb-2">
                        What is Forex?
                        </h3>
                        {/* Bloque con ícono y fecha */}
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                        

                        </div>
                        <p className="text-[16px] text-gray-700 mb-2">
                        Learn about this massively huge financial market where fiat currencies are traded.
                        </p>
                      </article>

                      <article className="rounded-md shadow-sm">
                        {/* Contenedor relativo para la imagen y el span */}
                        <div className="relative">
                          <Image
                            src="https://bpcdn.co/images/2011/04/11121955/Make-Money-Trading-Forex-1-360x188.png"
                            alt="Weekly FX Market Recap"
                            layout="responsive"
                            width={360}
                            height={188}
                            className="border border-gray-500"
                          />
                    
                        </div>
                        <h3 className="text-[21px]  font-bold text-gray-800 mt-4 mb-2">
                        How to Make Money Trading Forex
                        </h3>
                        {/* Bloque con ícono y fecha */}
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                        

                        </div>
                        <p className="text-[16px] text-gray-700 mb-2">
                        What is forex trading? How does forex trading work? What you need to know on how to get started in trading forex.
                        </p>
                      </article>
  
          {/* Bollinger Bands Card */}
          <article className="rounded-md shadow-sm">
                        {/* Contenedor relativo para la imagen y el span */}
                        <div className="relative">
                          <Image
                            src="https://bpcdn.co/images/2021/04/11134015/What-is-Technical-Analysis-360x188.png"
                            alt="Weekly FX Market Recap"
                            layout="responsive"
                            width={360}
                            height={188}
                            className="border border-gray-500"
                          />
                       
                        </div>
                        <h3 className="text-[21px]  font-bold text-gray-800 mt-4 mb-2">
                        What is Technical Analysis?
                        </h3>
                        {/* Bloque con ícono y fecha */}
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                        

                        </div>
                        <p className="text-[16px] text-gray-700 mb-2">
                        Technical analysis is the framework in which traders study price movement.
                        </p>
                      </article>
  
  
          {/* Heikin Ashi Card */}
          <article className="rounded-md shadow-sm">
                        {/* Contenedor relativo para la imagen y el span */}
                        <div className="relative">
                          <Image
                            src="https://bpcdn.co/images/2021/04/11203025/Moving-Averages-Lesson-2021-360x188.png"
                            alt="Weekly FX Market Recap"
                            layout="responsive"
                            width={360}
                            height={188}
                            className="border border-gray-500"
                          />
                    
                        </div>
                        <h3 className="text-[21px]  font-bold text-gray-800 mt-4 mb-2">
                        What Are Moving Averages?
                        </h3>
                        {/* Bloque con ícono y fecha */}
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                        

                        </div>
                        <p className="text-[16px] text-gray-700 mb-2">
                        A moving average is simply a way to smooth out price action over time. Here’s what it looks like.
                        </p>
                      </article>
  
        </div>
      </section>
    );
  };
  
  export default FeaturedLessons;