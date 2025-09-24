console.log(`Hello world`)

const PORT = 9999;

const handler = (request: Request): Response => {

    const url = new URL(request.url);

    switch (url.pathname) {
        case "/":
            return new Response("Welcome！\n");

        case "/api/greet":
            const name = url.searchParams.get("name") || "visitor";
            return new Response(
                JSON.stringify({ message: `Hello, ${name}!` }),
                { headers: { "Content-Type": "application/json" } }
            );

        case "/api/time":
            return new Response(
                JSON.stringify({ currentTime: new Date().toISOString() }),
                { headers: { "Content-Type": "application/json" } }
            );

        default:
            return new Response("Page not found :(", { status: 404 });
    }
};

console.log(`🚀 Server is running http://localhost:${PORT}/`);

// @ts-ignore
Deno.serve( { port: PORT }, handler);