export default function HeroBanner({ title, subtitle, imageSrc, imageAlt = "", className = "" }) {
  return (
    <section
      className={`w-full max-w-container_max_width mx-auto shrink-0 bg-[#F5F8FF] rounded-[2rem] flex justify-between items-center px-10 py-12 md:px-12 md:py-10 gap-8 ${className}`}
    >
      <div className="text-left">
        <h1 className="text-3xl md:text-[32px] font-extrabold text-gray-900 leading-[1.3]">{title}</h1>
        {subtitle && <p className="text-[15px] text-gray-600 mt-5 leading-relaxed max-w-md">{subtitle}</p>}
      </div>
      {imageSrc && (
        <div className="w-40 md:w-56 lg:w-[240px] flex-shrink-0 self-stretch">
          <img src={imageSrc} alt={imageAlt} className="w-full h-full object-contain object-bottom" />
        </div>
      )}
    </section>
  );
}
