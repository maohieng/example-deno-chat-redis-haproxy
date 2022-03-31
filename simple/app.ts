import {serve} from "https://deno.land/std@0.132.0/http/server.ts"

function handleHome(_req: Request): Response {
    return new Response(`Welcome to server ${Deno.env.get("SERV_ID")}`)
}

const port = Deno.env.get("PORT") || "8080"
console.log(`Server starts on http://localhost:${port}`)
serve(handleHome, {port: parseInt(port)})
