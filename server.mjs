import express from "express";
import next from "next";
import { createProxyMiddleware } from "http-proxy-middleware";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use(
    "/api/socket",
    createProxyMiddleware({
      target: `ws://${process.env.WEB_SOCKET_HOST_NAME}`,
      ws: true,
    })
  );

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(3000, process.env.SERVER_HOST_NAME, (err) => {
    if (err) throw err;
    console.log(`> Ready on ${process.env.NEXTAUTH_URL}`);
  });
});
