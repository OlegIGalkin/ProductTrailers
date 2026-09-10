import { Context } from '@netlify/functions'
import { getDb, rowToApi } from '../../../server/src/db.js';

export default async (req: Request, context: Context) => {
  try {
    const userAgent = req.headers.get('user-agent') || '';
    
    // Check if this is likely a real browser request
    const isBrowser = isRealBrowser(userAgent);
    
    // If not a browser, return early without querying and WITHOUT caching
    if (!isBrowser) {
      return Response.json(
        { 
          message: 'This endpoint is for browser clients only',
          videos: [] 
        },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store'   // 🔥 Disable caching for bots
          }
        }
      );
    }

    const db = await getDb();

    // Extract query parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Base query
    let sql = 'SELECT * FROM videos WHERE 1=1';
    const params: string[] = [];

    // Date range filter (UTC)
    if (startDate) {
      sql += ' AND time_when_added >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND time_when_added <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY time_when_added DESC';

    const result = await db.execute(sql, params);
    const rows = result.rows.map(rowToApi);

    // Cache for 6 hours for real browser requests
    return Response.json(rows, {
      headers: {
        'Cache-Control': 'public, max-age=28800'
      }
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error)

    return Response.json(
      {
        error: "Couldn't query the database.",
        details,
      },
      { status: 500 },
    )
  }
}

function isRealBrowser(userAgent: string): boolean {
  // Browser identifiers
  const browserPatterns = [
    /Mozilla/i,          // Most browsers
    /Chrome/i,           // Chrome, Chromium, and Chromium-based
    /Safari/i,           // Safari and WebKit-based
    /Firefox/i,          // Firefox
    /Edge/i,             // Edge
    /Opera/i,            // Opera
    /Brave/i,            // Brave
    /Vivaldi/i,          // Vivaldi
    /YaBrowser/i,        // Yandex Browser
    /Yandex/i,           // Yandex (fallback)
    /DuckDuckGo/i,       // DuckDuckGo browser
    /AppleWebKit/i,      // WebKit rendering engine
    /Gecko/i,            // Gecko rendering engine (Firefox)
  ];

  // Crawlers and bots to exclude
  const botPatterns = [
    // Generic bot indicators
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    
    // HTTP clients
    /curl/i,
    /wget/i,
    /python-requests/i,
    /postman/i,
    /insomnia/i,
    /http-client/i,
    /axios/i,
    /fetch/i,
    /node-fetch/i,
    /superagent/i,
    /got/i,
    
    // Headless browsers
    /puppeteer/i,
    /headless/i,
    /phantom/i,
    /selenium/i,
    /lighthouse/i,
    
    // Search engines
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,      // DuckDuckGo crawler (not the browser!)
    /baiduspider/i,
    /yandexbot/i,        // Yandex crawler (not the browser!)
    
    // Social media bots
    /facebookexternalhit/i,
    /facebot/i,
    /twitterbot/i,
    /telegrambot/i,
    /discordbot/i,
    /whatsapp/i,
  ];

  // Check if it's a bot first
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    return false;
  }

  // Check if it has browser characteristics
  const hasBrowserIndicator = browserPatterns.some(pattern => pattern.test(userAgent));
  
  // Additional check: standard browser format
  const hasBrowserFormat = /^Mozilla\/\d+\.\d+/.test(userAgent) && 
                          /Safari\/\d+/.test(userAgent);

  return hasBrowserIndicator || hasBrowserFormat;
}