export default function HeroBanner({ title, subtitle, imageSrc, imageAlt = "", className = "" }) {
  return (
    <section
      className={`w-full max-w-container_max_width mx-auto shrink-0 bg-[#F5F8FF] border border-blue-100/50 shadow-sm rounded-[2rem] flex flex-col md:flex-row md:justify-between md:items-center px-6 py-8 sm:px-10 sm:py-10 md:px-12 gap-6 md:gap-8 ${className}`}
    >
      <div className="text-left min-w-0 md:flex-1 break-keep">
        <h1 className="text-2xl sm:text-3xl md:text-[32px] font-extrabold text-gray-900 leading-[1.3] max-w-2xl text-balance">{title}</h1>
        {subtitle && <p className="text-[15px] text-gray-600 mt-4 md:mt-5 leading-relaxed max-w-xl">{subtitle}</p>}
      </div>
      {imageSrc && (
        <div className="w-32 sm:w-40 md:w-56 lg:w-[240px] flex-shrink-0 self-center md:self-stretch">
          <img src={imageSrc} alt={imageAlt} className="w-full h-auto md:h-full object-contain object-bottom" />
        </div>
      )}
    </section>
  );
}
