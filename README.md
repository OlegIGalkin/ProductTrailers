# Product Trailers – A YouTube-style autoplay channel for Product Hunt launches

This web app turns Product Hunt products into a continuous video feed. It embeds a YouTube player and plays launch trailers one after another – no clicking, no scrolling. Filter by category or sort by popularity/votes/comments.

This is a React client app, with a local Express API used for development and data access.

Unfortunately, there aren’t many places where you can showcase your app.

On Reddit, they ban you or delete your posts. X and other social media are filled with noise and spam. Startup directories are only useful for getting a backlink to your website.

The bottom line is that society isn’t very good at discovering novel things, and even great apps and startups are struggling in the gutter.

One way to improve this rather pathetic state of affairs is to make it easier to learn about new apps and products.

That’s why I made a humble attempt to do so and created Product Trailers.

Finally, a passive way to discover new products. Now, you can discover products while eating lunch.

## Prerequisites

- Node.js 18+

## License

This project is licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later). The full license text is in `LICENSE`.

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
```

## Hosting

Only the client is deployed. The app can be hosted on a static site host such as Netlify, while the local Express server remains for development and local API access.

## Database

The app takes data from a database hosted by Turso, which is filled with the Product Hunt data from this repo: [https://github.com/OlegIGalkin/ProductHunt-StatisticWithVideoURLs/](https://github.com/OlegIGalkin/ProductHunt-StatisticWithVideoURLs/)  
