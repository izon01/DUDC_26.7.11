export default function HeroBanner({ title, subtitle, imageSrc, imageAlt = "", className = "" }) {
  return (
    <section
      className={`w-full max-w-container_max_width mx-auto shrink-0 bg-gradient-to-r from-blue-50/80 to-white border border-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] rounded-2xl flex flex-col md:flex-row items-center justify-between px-8 md:px-12 py-10 gap-8 ${className}`}
    >
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-[32px] font-bold text-gray-800 leading-tight">{title}</h1>
        {subtitle && <p className="text-[15px] text-gray-500 mt-4 max-w-md">{subtitle}</p>}
      </div>
      {imageSrc && (
        <img src={imageSrc} alt={imageAlt} className="w-40 md:w-56 lg:w-64 max-h-[180px] object-contain shrink-0" />
      )}
    </section>
  );
}
