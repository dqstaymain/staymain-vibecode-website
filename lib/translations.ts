export const translations = {
  da: {
    nav: {
      services: 'Ydelser',
      work: 'Arbejde',
      about: 'Om os',
      contact: 'Kontakt',
      getStarted: 'Kom i gang'
    },
    hero: {
      title: 'Vi skaber digitale oplevelser, der tæller.',
      subtitle: 'StayMain er et kreativt webbureau i Danmark. Vi kombinerer moderne design med teknisk ekspertise for at bygge websites, der leverer resultater.',
      cta1: 'Se vores ydelser',
      cta2: 'Lad os tale sammen',
      ctaHjemmeside: 'Hjemmeside',
      ctaWebshop: 'Webshop',
      ctaMetaAds: 'Meta Ads'
    },
    services: {
      title: 'Vores ydelser',
      subtitle: 'Vi tilbyder alt inden for digital markedsføring og webudvikling'
    },
    testimonials: {
      title: 'Hvad vores kunder siger',
      items: [
        {
          text: 'StayMain har virkelig hjulpet os med at transformere vores online tilstedeværelse. Vores nye hjemmeside har øget vores konverteringer markant.',
          author: 'Mads Jensen',
          role: 'Direktør, Nordic Tech'
        },
        {
          text: 'Professionelt team med øje for detaljer. De forstod præcis hvad vi havde brug for, og leverede til tiden.',
          author: 'Sofie Andersen',
          role: 'Marketingchef, Copenhagen Eats'
        },
        {
          text: 'Vi har fået markant flere kunder via Google efter SEO-optimeringen. Kan varmt anbefale StayMain!',
          author: 'Lars Pedersen',
          role: 'Indehaver, Aarhus Bilpleje'
        },
        {
          text: 'Vores nye webshop er hurtigere og mere brugervenlig end før. Salget er steget med 40% på tre måneder.',
          author: 'Emma Nielsen',
          role: 'Stifter, Nordic fashion'
        },
        {
          text: 'God kommunikation og professionel håndtering af vores meta ads. ROI har været over forventning.',
          author: 'Mikkel Hansen',
          role: 'Head of Marketing, FitLife'
        }
      ]
    },
    footer: {
      tagline: 'Moderne webdesign fra Danmark.',
      copyright: '© 2024 StayMain. Alle rettigheder forbeholdes.'
    },
    contact: {
      info: {
        email: 'Hej@staymain.dk',
        phone: '+45 12 34 56 78',
        location: 'København, Danmark'
      }
    }
  },
  en: {
    nav: {
      services: 'Services',
      work: 'Work',
      about: 'About',
      contact: 'Contact',
      getStarted: 'Get Started'
    },
    hero: {
      title: 'We create digital experiences that matter.',
      subtitle: 'StayMain is a creative web agency based in Denmark. We combine modern design with technical expertise to build websites that deliver results.',
      cta1: 'See our services',
      cta2: "Let's talk",
      ctaHjemmeside: 'Website',
      ctaWebshop: 'Webshop',
      ctaMetaAds: 'Meta Ads'
    },
    services: {
      title: 'Our Services',
      subtitle: 'Full-service digital marketing and web development'
    },
    testimonials: {
      title: 'What our clients say',
      items: [
        {
          text: 'StayMain has really helped us transform our online presence. Our new website has increased our conversions significantly.',
          author: 'Mads Jensen',
          role: 'CEO, Nordic Tech'
        },
        {
          text: 'Professional team with an eye for detail. They understood exactly what we needed and delivered on time.',
          author: 'Sofie Andersen',
          role: 'Marketing Manager, Copenhagen Eats'
        },
        {
          text: 'We have gotten significantly more customers through Google after the SEO optimization. Can highly recommend StayMain!',
          author: 'Lars Pedersen',
          role: 'Owner, Aarhus Car Care'
        },
        {
          text: 'Our new webshop is faster and more user-friendly than before. Sales have increased by 40% in three months.',
          author: 'Emma Nielsen',
          role: 'Founder, Nordic fashion'
        },
        {
          text: 'Great communication and professional handling of our meta ads. ROI has been above expectations.',
          author: 'Mikkel Hansen',
          role: 'Head of Marketing, FitLife'
        }
      ]
    },
    footer: {
      tagline: 'Modern web design from Denmark.',
      copyright: '© 2024 StayMain. All rights reserved.'
    },
    contact: {
      info: {
        email: 'hello@staymain.dk',
        phone: '+45 12 34 56 78',
        location: 'Copenhagen, Denmark'
      }
    }
  }
}

export type Language = 'da' | 'en'
export type Translations = typeof translations.da

export const servicesList = [
  { 
    key: 'Hjemmeside', 
    keyEn: 'Website',
    desc: 'Skræddersyede hjemmesider der converterer besøgende til kunder.',
    descEn: 'Custom websites that convert visitors into customers.'
  },
  { 
    key: 'Webshop', 
    keyEn: 'Webshop',
    desc: 'Professionelle webshops med fokus på salg og brugeroplevelse.',
    descEn: 'Professional webshops focused on sales and user experience.'
  },
  { 
    key: 'Appudvikling', 
    keyEn: 'App Development',
    desc: 'Native og cross-platform apps til iOS og Android.',
    descEn: 'Native and cross-platform apps for iOS and Android.'
  },
  { 
    key: 'Support & Hosting', 
    keyEn: 'Support & Hosting',
    desc: 'Pålidelig hosting og lynhurtig support døgnet rundt.',
    descEn: 'Reliable hosting and 24/7 fast support.'
  },
  { 
    key: 'SEO', 
    keyEn: 'SEO',
    desc: 'Optimer din synlighed og rank højere på Google.',
    descEn: 'Optimize your visibility and rank higher on Google.'
  },
  { 
    key: 'Meta Ads', 
    keyEn: 'Meta Ads',
    desc: 'Målrettede kampagner på Facebook og Instagram.',
    descEn: 'Targeted campaigns on Facebook and Instagram.'
  },
  { 
    key: 'E-mail Marketing', 
    keyEn: 'Email Marketing',
    desc: 'Effektive nyhedsbreve der driver engagement og salg.',
    descEn: 'Effective newsletters that drive engagement and sales.'
  },
  { 
    key: 'Grafisk Design', 
    keyEn: 'Graphic Design',
    desc: 'Unikt design der kommunikerer dit brands værdier.',
    descEn: 'Unique design that communicates your brand values.'
  },
  { 
    key: 'Foto & Video', 
    keyEn: 'Photo & Video',
    desc: 'Professionelt indhold der fortæller din virksomheds historie.',
    descEn: 'Professional content that tells your business story.'
  }
]
