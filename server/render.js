const React = require("react");
const ReactDOMServer = require("react-dom/server");

const { default: Root, AppHelmet: Helmet } = require("./build/server-bundle");

const pageCache = {};

const createDocument = (location, helmet, content) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Learn React with interactive examples." />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="http://www.react.express/" />
    <meta property="og:site_name" content="React Express" />
    <meta property="og:title" content="React Express" />
    <meta property="og:description" content="Learn React with interactive examples." />
    <meta property="og:image" content="http://www.reactnativeexpress.com/logo@2x.png" />
    <meta property="og:image:width" content="256" />
    <meta property="og:image:height" content="256" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:card" content="summary" />
    <meta property="og:site" content="@devinaabbott" />
    <meta property="og:creator" content="@devinaabbott" />
    <meta property="fb:app_id" content="907755649360812" />
    ${helmet.title.toString()}
    ${helmet.meta.toString()}
    ${helmet.link.toString()}
    <link rel="stylesheet" type="text/css" href="reset.css">
    <link rel="stylesheet" type="text/css" href="main.css">
    <script>
      window.INITIAL_STATE = {location: ${JSON.stringify(location)}}
    </script>
  </head>
  <body>
    <div id="root">${content}</div>
    <script src="bundle.js"></script>
  </body>
</html>
`;

const renderPage = (location, isMobile) => {
  let content = ReactDOMServer.renderToString(
    React.createElement(Root, { location })
  );

  const helmet = Helmet.renderStatic();

  // TODO Figure out why display value is getting replaced with [object Object]
  content = content.replace(/display:\[object Object\]/g, "display:flex");

  // Don't SSR on mobile yet - since we're doing layouts in JS there might
  // be a flash when the layout switches. Dimensions are currently grabbed
  // from 'window' by react-styles-provider at launch, so we can't override them.
  return createDocument(
    isMobile ? "" : location,
    helmet,
    isMobile ? "" : content
  );
};

// Primitive mobile detection (same as used by client)
const detectMobile = (userAgent = "") =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent
  );

const getCacheKey = (location, isMobile) => `${location}:${isMobile}`;

module.exports = (req, res) => {
  const location = req.url;
  const isMobile = detectMobile(req.headers["user-agent"]);
  const cacheKey = getCacheKey(location, isMobile);

  if (!pageCache[cacheKey]) {
    pageCache[cacheKey] = renderPage(location, isMobile);
  }

  return res.send(pageCache[cacheKey]);
};
