import { fromFileUrl } from "https://deno.land/std@0.132.0/path/mod.ts"
import { readableStreamFromReader } from "https://deno.land/std@0.132.0/streams/conversion.ts"
import { connect } from "https://deno.land/x/redis@v0.25.4/mod.ts";

// See https://deno.land/std@0.132.0/examples/chat/server.ts
// See https://github.com/hnasr/javascript_playground/blob/master/ws-live-chat-system/app/index.mjs
// See https://deno.land/x/redis

const clients = new Map<number, WebSocket>();
let clientId = 0;
const CHAT_CHANNEL = "livechat";
const SERV_ID = Deno.env.get("SERV_ID");

const subscriber = await connect({
    port: 6379,
    hostname: 'rds'
});
const publisher = await connect({
    port: 6379,
    hostname: 'rds'
})
const sub = await subscriber.subscribe(CHAT_CHANNEL);

(async function () {
    for await (const { channel, message } of sub.receive()) {
      // on message
      try{
            //when we receive a message I want t
            console.log(`Server ${SERV_ID} received in channel '${channel}' message: ${message}`);
            clients.forEach((c) => c.send(message));
        }
        catch(ex){
          console.error("Error trying to send into conn after subscriber received.", ex)
        }
    }
  })();

function dispatch(msg: string): void {
    publisher.publish(CHAT_CHANNEL, msg);
}

function say(id: number, msg: string): void {
    dispatch(`${SERV_ID}:${id} says: ${msg}`)
}

function wsHandler(ws: WebSocket) {
    const id = ++clientId;
    clients.set(id, ws)

    ws.onopen = () => {
        console.log("Opened", id);
        setTimeout(() => dispatch(`${SERV_ID}:${id} joined`), 200)
    }
    ws.onclose = () => {
        console.log("Closed", id);
        clients.delete(id)
        dispatch(`${SERV_ID}:${id} left`)
    };
    ws.onmessage = (e) => {
        console.log(`Server ${SERV_ID}:${ws} says ${e.data}`)
        say(id, e.data)
    }
    
    //setTimeout(() => ws.send(`You joined as ${id} on server ${SERV_ID}`), 500)
}

async function requestHandler(req: Deno.RequestEvent) {
    const pathname = new URL(req.request.url).pathname;
    if (req.request.method === "GET" && pathname === "/") {
        // Serve with hack
        const u = new URL("./index.html", import.meta.url)
        if (u.protocol.startsWith("http")) {
            // server launched by deno run http(s)://.../server.ts
            fetch(u.href).then(async (resp) => {
                const body = new Uint8Array(await resp.arrayBuffer());
                req.respondWith(new Response(body, {
                    status: resp.status,
                    headers: {
                        "content-type": "text/html",
                    },
                    }),
                );
            });
        } else {
            // server launched by deno run ./server.ts
            const file = await Deno.open(fromFileUrl(u));
            req.respondWith(
                new Response(readableStreamFromReader(file), {
                    status: 200,
                    headers: {
                        "content-type": "text/html",
                    }
                })
            );
        }
    } else if (req.request.method === "GET" && pathname === "/favicon.ico") {
        req.respondWith(Response.redirect("https://deno.land/favicon.ico", 302));
    } else if (req.request.method === "GET" && pathname === "/ws") {
        const { socket, response } = Deno.upgradeWebSocket(req.request);
        wsHandler(socket);
        req.respondWith(response)
    }
}

const server = Deno.listen({port: 8080});
console.log(`Innovation Festival Chat server ${SERV_ID} starting on :8080...`);

for await (const conn of server) {
    (async () => {
        const httpConn = Deno.serveHttp(conn);
        for await (const requestEvent of httpConn) {
            requestHandler(requestEvent)
        }
    })();
}