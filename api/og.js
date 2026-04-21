import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const h = (type, props = {}, ...children) => ({
  type,
  props: { ...props, children: children.flat(Infinity).filter(Boolean) },
  key: null,
});

const COURIER_URL =
  'https://fonts.googleapis.com/css2?family=Courier+Prime:wght@700&display=swap';
const INTER_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap';

async function loadGoogleFont(cssUrl) {
  const css = await fetch(cssUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  }).then((r) => r.text());
  const match = css.match(/src:\s*url\((https:\/\/[^)]+\.(?:woff2|woff|ttf))\)/);
  if (!match) throw new Error(`Font URL not found in ${cssUrl}`);
  const fontRes = await fetch(match[1]);
  return await fontRes.arrayBuffer();
}

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const eyebrow = (url.searchParams.get('eyebrow') ?? 'Dialogbuch · Dramaturgie').slice(0, 80);
    const title = (url.searchParams.get('title') ?? 'Feiste Dialoge').slice(0, 120);
    const subtitle = (url.searchParams.get('subtitle') ?? 'Worte, die wirken & bleiben.').slice(0, 160);
    const meta = (url.searchParams.get('meta') ?? '').slice(0, 80);

    const [courier, inter] = await Promise.all([
      loadGoogleFont(COURIER_URL),
      loadGoogleFont(INTER_URL),
    ]);

    const element = h(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: '#fbfaf1',
          backgroundImage:
            'radial-gradient(circle at 12% 18%, rgba(148, 168, 100, 0.18) 0, transparent 50%), radial-gradient(circle at 88% 82%, rgba(83, 101, 41, 0.12) 0, transparent 60%)',
          fontFamily: 'Inter, sans-serif',
          color: '#1b1c17',
        },
      },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 14 } },
        h('div', {
          style: {
            width: 14,
            height: 14,
            backgroundColor: '#536529',
            borderRadius: 999,
          },
        }),
        h(
          'div',
          {
            style: {
              fontFamily: 'Courier',
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: -0.6,
              color: '#1b1c17',
            },
          },
          'Feiste Dialoge'
        )
      ),
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1000 } },
        h(
          'div',
          {
            style: {
              fontFamily: 'Courier',
              fontSize: 22,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#536529',
              display: 'flex',
            },
          },
          eyebrow
        ),
        h(
          'div',
          {
            style: {
              fontFamily: 'Courier',
              fontSize: title.length > 36 ? 72 : 92,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1.4,
              color: '#1b1c17',
              display: 'flex',
            },
          },
          title
        ),
        subtitle &&
          h(
            'div',
            {
              style: {
                fontFamily: 'Inter',
                fontSize: 30,
                fontWeight: 500,
                lineHeight: 1.35,
                color: '#45483c',
                maxWidth: 900,
                display: 'flex',
              },
            },
            subtitle
          )
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(27, 28, 23, 0.12)',
            paddingTop: 20,
          },
        },
        h(
          'div',
          {
            style: {
              fontFamily: 'Courier',
              fontSize: 20,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: '#45483c',
              display: 'flex',
            },
          },
          'feiste-dialoge.de'
        ),
        meta &&
          h(
            'div',
            {
              style: {
                fontFamily: 'Courier',
                fontSize: 20,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: '#536529',
                display: 'flex',
              },
            },
            meta
          )
      )
    );

    return new ImageResponse(element, {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Courier', data: courier, style: 'normal', weight: 700 },
        { name: 'Inter', data: inter, style: 'normal', weight: 500 },
      ],
    });
  } catch (err) {
    return new Response(`OG generation failed: ${err?.message ?? 'unknown'}`, {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
}
