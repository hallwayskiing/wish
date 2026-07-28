// @ts-expect-error qrcode browser module missing type declarations
import QRCode from 'qrcode/lib/browser.js';

export async function siteQrCode(request: Request): Promise<Response> {
  const siteUrl = new URL('/', request.url).href;
  const svg = await QRCode.toString(siteUrl, {
    type: 'svg',
    width: 160,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#17100d',
      light: '#f7f0e4'
    }
  });

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=86400'
    }
  });
}
