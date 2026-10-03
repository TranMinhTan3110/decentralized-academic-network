export interface FooterProps {
  brandName?: string;
  tagline?: string;
  disclaimer?: string;
}

export function Footer({
  brandName = 'mục lục.',
  tagline = 'Học từ những điều được chia sẻ.',
  disclaimer = 'Dữ liệu minh họa · Không liên kết với các trường',
}: FooterProps) {
  return (
    <footer className="border-t-2 border-[#dce4f1] mt-6 py-6 px-4 md:px-0 flex flex-col md:flex-row justify-between gap-3 text-[11px] text-[#5f6878]">
      <span className="font-semibold">
        {brandName} <span className="font-normal ml-2">{tagline}</span>
      </span>
      <span>{disclaimer}</span>
    </footer>
  );
}
