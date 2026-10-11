import React from 'react';

/**
 * PageHeader - Header standar seluruh halaman
 * Menghilangkan eyebrow pill lebay, menjamin satu pola lebar konten yang konsisten,
 * judul ringkas (1-4 kata), dan deskripsi maksimal 1 kalimat jelas.
 */
const PageHeader = ({
  title,
  description,
  badge,
  actions,
  className = ''
}) => {
  return (
    <div className={`mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200/80 ${className}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-xs md:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
