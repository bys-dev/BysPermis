/**
 * Composant à inclure UNE SEULE FOIS dans `app/layout.tsx`.
 *
 * Charge les scripts de tracking (GA4, GTM, Google Ads, Meta Pixel) en
 * respectant Google Consent Mode v2 : aucun cookie marketing n'est posé
 * avant le consentement utilisateur.
 *
 * Les scripts ne s'injectent dans le DOM que si l'identifiant correspondant
 * est défini dans .env.local (NEXT_PUBLIC_*), sinon le composant est inerte.
 */

import Script from "next/script";
import {
  GA4_ID,
  GOOGLE_ADS_ID,
  GTM_ID,
  META_PIXEL_ID,
  hasGA4,
  hasGTM,
  hasGoogleAds,
  hasMetaPixel,
} from "@/lib/analytics";

export default function Analytics() {
  const showGoogle = hasGA4() || hasGTM() || hasGoogleAds();
  const showMeta = hasMetaPixel();

  if (!showGoogle && !showMeta) return null;

  return (
    <>
      {showGoogle && (
        <>
          {/* Consent Mode v2 — défaut "denied" avant choix utilisateur */}
          <Script id="consent-default" strategy="beforeInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied',
                'functionality_storage': 'granted',
                'personalization_storage': 'denied',
                'security_storage': 'granted',
                'wait_for_update': 500
              });
              gtag('set', 'ads_data_redaction', true);
              gtag('set', 'url_passthrough', true);
            `}
          </Script>

          {/* Google Tag (gtag.js) — pour GA4 + Google Ads */}
          {(hasGA4() || hasGoogleAds()) && (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID || GOOGLE_ADS_ID}`}
                strategy="afterInteractive"
              />
              <Script id="gtag-init" strategy="afterInteractive">
                {`
                  gtag('js', new Date());
                  ${GA4_ID ? `gtag('config', '${GA4_ID}', { anonymize_ip: true, allow_google_signals: false });` : ""}
                  ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
                `}
              </Script>
            </>
          )}

          {/* Google Tag Manager (alternative au gtag direct si Sébastien préfère GTM) */}
          {hasGTM() && (
            <Script id="gtm" strategy="afterInteractive">
              {`
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${GTM_ID}');
              `}
            </Script>
          )}
        </>
      )}

      {/* Meta Pixel (Facebook / Instagram Ads) */}
      {showMeta && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('consent', 'revoke');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* Fallback noscript pour GTM */}
      {hasGTM() && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
      )}

      {/* Fallback noscript pour Meta Pixel */}
      {showMeta && (
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      )}
    </>
  );
}
