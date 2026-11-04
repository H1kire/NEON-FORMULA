"use strict";
const http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),host=process.env.HOST||"127.0.0.1",port=Number(process.env.PORT)||4173;
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".ico":"image/x-icon"};
http.createServer((request,response)=>{
 if(request.method!=="GET"&&request.method!=="HEAD"){response.writeHead(405,{"Allow":"GET, HEAD"});response.end("Method not allowed");return}
 let pathname;try{pathname=decodeURIComponent(new URL(request.url,"http://localhost").pathname)}catch{response.writeHead(400);response.end("Bad request");return}
 const relative=pathname==="/"?"index.html":pathname.replace(/^\/+/,"");
 if(relative.split(/[\\/]/).some(part=>part.startsWith(".")||part==="node_modules")){response.writeHead(403);response.end("Forbidden");return}
 const target=path.resolve(root,relative);if(target!==root&&!target.startsWith(root+path.sep)){response.writeHead(403);response.end("Forbidden");return}
 fs.stat(target,(error,stat)=>{if(error||!stat.isFile()){response.writeHead(404);response.end("Not found");return}
 response.writeHead(200,{"Content-Type":mime[path.extname(target).toLowerCase()]||"application/octet-stream","X-Content-Type-Options":"nosniff","Cache-Control":"no-cache"});
 if(request.method==="HEAD")response.end();else fs.createReadStream(target).pipe(response)
 })
}).listen(port,host,()=>process.stdout.write("FORMULA ASCENT local server: http://"+host+":"+port+"\n"));
