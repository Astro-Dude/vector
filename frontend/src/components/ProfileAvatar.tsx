import { useState } from 'react';

interface ProfileAvatarProps {
  src?: string;
  name?: string;
  email?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10 md:w-12 md:h-12 text-sm md:text-base',
  md: 'w-16 h-16 md:w-20 md:h-20 text-lg md:text-xl',
  lg: 'w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 text-xl md:text-2xl lg:text-3xl',
};

export default function ProfileAvatar({
  src,
  name,
  email,
  size = 'sm',
  className = ''
}: ProfileAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const fallbackLetter = (name || email || 'U').charAt(0).toUpperCase();
  const showFallback = !src || imageError;

  return (
    <div className={`rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}>
      {showFallback ? (
        <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold">
            {fallbackLetter}
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={name || 'Profile'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}
