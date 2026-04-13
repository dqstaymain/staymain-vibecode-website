'use client'

import { useEffect } from 'react'
import { useCMS } from '@/lib/cms'

export default function Favicon() {
  const { contactInfo } = useCMS()

  useEffect(() => {
    if (contactInfo.favicon) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = contactInfo.favicon
    }
  }, [contactInfo.favicon])

  return null
}
