import {serve} from "https://deno.land/std@0.132.0/http/server.ts"

const SERV_ID = Deno.env.get("SERV_ID");
function handleHome(_req: Request): Response {
    return new Response(`Welcome to server ${SERV_ID}`)
}

console.log(`Server ${SERV_ID} starts on :8080`)
serve(handleHome, {port: 8080})
