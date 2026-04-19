import { Pinyon_Script, DM_Sans } from 'next/font/google'

export const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const script = Pinyon_Script({
  subsets: ['latin'],
  weight: ['400'],
})

export const body = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

import localFont from 'next/font/local'

export const quicksand = localFont({
  src: [
    {
      path: '../public/fonts/Quicksand-Regular.woff2',
      weight: '400',
    },
    {
      path: '../public/fonts/Quicksand-Medium.woff2',
      weight: '500',
    },
  ],
})
import { Cormorant_Garamond } from 'next/font/google'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})