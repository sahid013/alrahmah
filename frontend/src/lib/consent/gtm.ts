import { CONSENT_COOKIE, CONSENT_VERSION } from './consent';

/**
 * Google Tag Manager snippets (container `NEXT_PUBLIC_GTM_ID`), as Google's install page gives
 * them, with Consent Mode v2 set first:
 *  1. defaults: everything denied (`wait_for_update` gives the banner time to answer);
 *  2. the visitor's saved choice from the consent cookie, if they've made one;
 *  3. the standard GTM loader.
 * Rendered as the first thing in <head> by the root layout. The staff dashboard is skipped, so
 * donor screens are never tracked. Later changes in the banner are sent by `ConsentModeSync`.
 */
export function gtmHeadScript(containerId: string): string {
  const id = JSON.stringify(containerId);
  return `(function(w,d){
if(w.location.pathname.indexOf('/dashboard')===0)return;
w.dataLayer=w.dataLayer||[];function gtag(){w.dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
try{var m=d.cookie.match(/(?:^|; )${CONSENT_COOKIE}=([^;]*)/);if(m){var c=JSON.parse(decodeURIComponent(m[1]));if(c.v===${CONSENT_VERSION}){var a=c.analytics?'granted':'denied',k=c.marketing?'granted':'denied';gtag('consent','update',{analytics_storage:a,ad_storage:k,ad_user_data:k,ad_personalization:k});}}}catch(e){}
w.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName('script')[0],j=d.createElement('script');j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(${id});f.parentNode.insertBefore(j,f);
})(window,document);`;
}

/** The <noscript> iframe that goes right after the opening <body>. */
export const gtmNoscriptSrc = (containerId: string) =>
  `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(containerId)}`;
