import Image from 'next/image';

export const Logo = () => (
  <div className="flex justify-center mb-4">
    <Image 
      src="is-iso.webp" 
      alt="Indices Sinteticos" 
      width={61} 
      height={54} 
    />
  </div>
);