import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const TurboLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#FF1E56"
    role="img"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Turborepo</title>
    <path d="M11.9906 4.1957c-4.2998 0-7.7981 3.501-7.7981 7.8043s3.4983 7.8043 7.7981 7.8043c4.2999 0 7.7982-3.501 7.7982-7.8043s-3.4983-7.8043-7.7982-7.8043m0 11.843c-2.229 0-4.0356-1.8079-4.0356-4.0387s1.8065-4.0387 4.0356-4.0387S16.0262 9.7692 16.0262 12s-1.8065 4.0388-4.0356 4.0388m.6534-13.1249V0C18.9726.3386 24 5.5822 24 12s-5.0274 11.66-11.356 12v-2.9139c4.7167-.3372 8.4516-4.2814 8.4516-9.0861s-3.735-8.749-8.4516-9.0861M5.113 17.9586c-1.2502-1.4446-2.0562-3.2845-2.2-5.3046H0c.151 2.8266 1.2808 5.3917 3.051 7.3668l2.0606-2.0622zM11.3372 24v-2.9139c-2.02-.1439-3.8584-.949-5.3019-2.2018l-2.0606 2.0623c1.975 1.773 4.538 2.9022 7.361 3.0534z" />
  </svg>
);

export const NxLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#143055"
    role="img"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Nx</title>
    <path d="M11.987 14.138l-3.132 4.923-5.193-8.427-.012 8.822H0V4.544h3.691l5.247 8.833.005-3.998 3.044 4.759zm.601-5.761c.024-.048 0-3.784.008-3.833h-3.65c.002.059-.005 3.776-.003 3.833h3.645zm5.634 4.134a2.061 2.061 0 0 0-1.969 1.336 1.963 1.963 0 0 1 2.343-.739c.396.161.917.422 1.33.283a2.1 2.1 0 0 0-1.704-.88zm3.39 1.061c-.375-.13-.8-.277-1.109-.681-.06-.08-.116-.17-.176-.265a2.143 2.143 0 0 0-.533-.642c-.294-.216-.68-.322-1.18-.322a2.482 2.482 0 0 0-2.294 1.536 2.325 2.325 0 0 1 4.002.388.75.75 0 0 0 .836.334c.493-.105.46.36 1.203.518v-.133c-.003-.446-.246-.55-.75-.733zm2.024 1.266a.723.723 0 0 0 .347-.638c-.01-2.957-2.41-5.487-5.37-5.487a5.364 5.364 0 0 0-4.487 2.418c-.01-.026-1.522-2.39-1.538-2.418H8.943l3.463 5.423-3.379 5.32h3.54l1.54-2.366 1.568 2.366h3.541l-3.21-5.052a.7.7 0 0 1-.084-.32 2.69 2.69 0 0 1 2.69-2.691h.001c1.488 0 1.736.89 2.057 1.308.634.826 1.9.464 1.9 1.541a.707.707 0 0 0 1.066.596zm.35.133c-.173.372-.56.338-.755.639-.176.271.114.412.114.412s.337.156.538-.311c.104-.231.14-.488.103-.74z" />
  </svg>
);

export const LernaLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#9333EA"
    role="img"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Lerna</title>
    <path d="M12.87 10.071l5.551 9.618h1.073L12.87 7.93zm0 0L6.536 0H4.389l7.394 12.81 1.087-1.882zm5.551 9.618L12 12.212l-1.087 1.882 5.435 9.412h2.147zM12 12.212l-5.435-9.43H4.418l6.495 11.313zm6.506 5.787H5.494L4.418 19.88h15.164zM5.494 18L12 6.712 10.913 4.83 3.345 18zm0 0l6.506 5.506 6.507-5.505z" />
  </svg>
);

export const PnpmLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#F69220"
    role="img"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>pnpm</title>
    <path d="M0 0v7.5h7.5V0zm8.25 0v7.5h7.498V0zm8.25 0v7.5H24V0zM8.25 8.25v7.5h7.498v-7.5zm8.25 0v7.5H24v-7.5zM0 16.5V24h7.5v-7.5zm8.25 0V24h7.498v-7.5zm8.25 0V24H24v-7.5z" />
  </svg>
);

export const RushLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#0078D4"
    role="img"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Rush</title>
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.24 3.62L12 11.42 4.76 7.8 12 4.18zM4 16.54V9.23l7 3.5v7.31l-7-3.5zm9 3.5v-7.31l7-3.5v7.31l-7 3.5z" />
  </svg>
);

// Map orchestrator type to logo component
export const orchestratorLogos = {
  turbo: TurboLogo,
  nx: NxLogo,
  lerna: LernaLogo,
  pnpm: PnpmLogo,
  rush: RushLogo,
} as const;

// Brand colors for each orchestrator
export const orchestratorColors = {
  turbo: '#FF1E56',
  nx: '#143055',
  lerna: '#9333EA',
  pnpm: '#F69220',
  rush: '#0078D4',
  none: '#6B7280',
} as const;
