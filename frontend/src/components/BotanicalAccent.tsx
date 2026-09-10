interface Props {
  side?: 'left' | 'right';
  className?: string;
  variant?: 'sprig' | 'bloom';
}

export default function BotanicalAccent({ side = 'right', className = '', variant = 'sprig' }: Props) {
  return (
    <svg aria-hidden="true" viewBox="0 0 150 240" fill="none" className={`pointer-events-none absolute z-0 w-24 opacity-30 sm:w-32 ${side === 'left' ? '-left-8 -scale-x-100' : '-right-8'} ${className}`}>
      {variant === 'sprig' ? (
        <>
          <path d="M118 232C94 187 83 147 91 101C96 70 109 42 132 13" stroke="#D98963" strokeWidth="2" strokeLinecap="round" />
          <path d="M93 159C62 151 42 134 31 107C61 107 83 121 93 159Z" fill="#F4B995" />
          <path d="M91 113C112 91 132 83 146 86C139 108 120 121 91 113Z" fill="#F4B995" />
          <path d="M104 65C79 57 65 43 60 21C84 23 101 38 104 65Z" fill="#F4B995" />
          <circle cx="93" cy="158" r="4" fill="#D98963" />
          <circle cx="105" cy="65" r="4" fill="#D98963" />
        </>
      ) : (
        <>
          <path d="M76 233C75 188 77 143 75 95" stroke="#D98963" strokeWidth="2" strokeLinecap="round" />
          <path d="M76 170C48 159 32 140 29 114C54 118 72 137 76 170Z" fill="#F4B995" />
          <path d="M76 142C101 133 118 116 124 92C99 94 81 112 76 142Z" fill="#F4B995" />
          <path d="M75 102C57 80 56 56 75 36C94 56 93 80 75 102Z" fill="#F4B995" />
          <circle cx="75" cy="31" r="12" fill="#F4B995" />
          <circle cx="60" cy="37" r="11" fill="#F7C8AA" />
          <circle cx="90" cy="37" r="11" fill="#F7C8AA" />
          <circle cx="75" cy="45" r="11" fill="#EFA57B" />
          <circle cx="75" cy="37" r="5" fill="#D98963" />
        </>
      )}
    </svg>
  );
}
