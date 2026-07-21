export default function HeroBanner({ title, subtitle, imageSrc, imageAlt = "", className = "" }) {
  return (
    <section
      className={`w-full max-w-container_max_width mx-auto shrink-0 bg-blue-50 border border-gray-200 rounded-2xl flex flex-col md:flex-row items-center justify-between px-8 py-10 gap-8 ${className}`}
    >
      <div className="text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-on-surface leading-tight">{title}</h1>
        {subtitle && <p className="text-lg text-gray-600 mt-4 max-w-md">{subtitle}</p>}
      </div>
      {imageSrc && (
        <img src={imageSrc} alt={imageAlt} className="w-40 md:w-56 lg:w-64 object-contain shrink-0" />
      )}
    </section>
  );
}
