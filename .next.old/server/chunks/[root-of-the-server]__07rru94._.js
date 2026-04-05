module.exports=[18622,(e,t,s)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,s)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,s)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},20635,(e,t,s)=>{t.exports=e.x("next/dist/server/app-render/action-async-storage.external.js",()=>require("next/dist/server/app-render/action-async-storage.external.js"))},24725,(e,t,s)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},66680,(e,t,s)=>{t.exports=e.x("node:crypto",()=>require("node:crypto"))},93695,(e,t,s)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},36345,(e,t,s)=>{t.exports={name:"next",version:"16.2.1",description:"The React Framework",main:"./dist/server/next.js",license:"MIT",repository:"vercel/next.js",bugs:"https://github.com/vercel/next.js/issues",homepage:"https://nextjs.org",types:"index.d.ts",files:["dist","app.js","app.d.ts","babel.js","babel.d.ts","client.js","client.d.ts","compat","cache.js","cache.d.ts","constants.js","constants.d.ts","document.js","document.d.ts","dynamic.js","dynamic.d.ts","error.js","error.d.ts","future","legacy","script.js","script.d.ts","server.js","server.d.ts","head.js","head.d.ts","image.js","image.d.ts","link.js","link.d.ts","form.js","form.d.ts","router.js","router.d.ts","jest.js","jest.d.ts","og.js","og.d.ts","root-params.js","root-params.d.ts","types.d.ts","types.js","index.d.ts","types/global.d.ts","types/compiled.d.ts","image-types/global.d.ts","navigation-types/navigation.d.ts","navigation-types/compat/navigation.d.ts","font","navigation.js","navigation.d.ts","headers.js","headers.d.ts","navigation-types","web-vitals.js","web-vitals.d.ts","experimental/testing/server.js","experimental/testing/server.d.ts","experimental/testmode/playwright.js","experimental/testmode/playwright.d.ts","experimental/testmode/playwright/msw.js","experimental/testmode/playwright/msw.d.ts","experimental/testmode/proxy.js","experimental/testmode/proxy.d.ts"],bin:{next:"./dist/bin/next"},scripts:{dev:"cross-env NEXT_SERVER_NO_MANGLE=1 taskr",build:"taskr release",prepublishOnly:"cd ../../ && turbo run build",types:"tsc --project tsconfig.build.json --declaration --emitDeclarationOnly --stripInternal --declarationDir dist",typescript:"tsec --noEmit","ncc-compiled":"taskr ncc",storybook:"BROWSER=none storybook dev -p 6006","build-storybook":"storybook build","test-storybook":"test-storybook"},taskr:{requires:["./taskfile-webpack.js","./taskfile-ncc.js","./taskfile-swc.js","./taskfile-watch.js"]},dependencies:{"@next/env":"16.2.1","@swc/helpers":"0.5.15","baseline-browser-mapping":"^2.9.19","caniuse-lite":"^1.0.30001579",postcss:"8.4.31","styled-jsx":"5.1.6"},peerDependencies:{"@opentelemetry/api":"^1.1.0","@playwright/test":"^1.51.1","babel-plugin-react-compiler":"*",react:"^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0","react-dom":"^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0",sass:"^1.3.0"},peerDependenciesMeta:{"babel-plugin-react-compiler":{optional:!0},sass:{optional:!0},"@opentelemetry/api":{optional:!0},"@playwright/test":{optional:!0}},optionalDependencies:{sharp:"^0.34.5","@next/swc-darwin-arm64":"16.2.1","@next/swc-darwin-x64":"16.2.1","@next/swc-linux-arm64-gnu":"16.2.1","@next/swc-linux-arm64-musl":"16.2.1","@next/swc-linux-x64-gnu":"16.2.1","@next/swc-linux-x64-musl":"16.2.1","@next/swc-win32-arm64-msvc":"16.2.1","@next/swc-win32-x64-msvc":"16.2.1"},devDependencies:{"@babel/core":"7.26.10","@babel/eslint-parser":"7.24.6","@babel/generator":"7.27.0","@babel/plugin-syntax-bigint":"7.8.3","@babel/plugin-syntax-dynamic-import":"7.8.3","@babel/plugin-syntax-import-attributes":"7.26.0","@babel/plugin-syntax-jsx":"7.25.9","@babel/plugin-syntax-typescript":"7.25.4","@babel/plugin-transform-class-properties":"7.25.9","@babel/plugin-transform-export-namespace-from":"7.25.9","@babel/plugin-transform-modules-commonjs":"7.26.3","@babel/plugin-transform-numeric-separator":"7.25.9","@babel/plugin-transform-object-rest-spread":"7.25.9","@babel/plugin-transform-runtime":"7.26.10","@babel/preset-env":"7.26.9","@babel/preset-react":"7.26.3","@babel/preset-typescript":"7.27.0","@babel/runtime":"7.27.0","@babel/traverse":"7.27.0","@babel/types":"7.27.0","@base-ui-components/react":"1.0.0-beta.2","@capsizecss/metrics":"3.4.0","@edge-runtime/cookies":"6.0.0","@edge-runtime/ponyfill":"4.0.0","@edge-runtime/primitives":"6.0.0","@hapi/accept":"5.0.2","@jest/transform":"29.5.0","@jest/types":"29.5.0","@modelcontextprotocol/sdk":"1.18.1","@mswjs/interceptors":"0.23.0","@napi-rs/triples":"1.2.0","@next/font":"16.2.1","@next/polyfill-module":"16.2.1","@next/polyfill-nomodule":"16.2.1","@next/react-refresh-utils":"16.2.1","@next/swc":"16.2.1","@opentelemetry/api":"1.6.0","@playwright/test":"1.58.2","@rspack/core":"1.6.7","@storybook/addon-a11y":"8.6.0","@storybook/addon-essentials":"8.6.0","@storybook/addon-interactions":"8.6.0","@storybook/addon-webpack5-compiler-swc":"3.0.0","@storybook/blocks":"8.6.0","@storybook/react":"8.6.0","@storybook/react-webpack5":"8.6.0","@storybook/test":"8.6.0","@storybook/test-runner":"0.21.0","@swc/core":"1.11.24","@swc/types":"0.1.7","@taskr/clear":"1.1.0","@taskr/esnext":"1.1.0","@types/babel__code-frame":"7.0.6","@types/babel__core":"7.20.5","@types/babel__generator":"7.27.0","@types/babel__template":"7.4.4","@types/babel__traverse":"7.20.7","@types/bytes":"3.1.1","@types/ci-info":"2.0.0","@types/compression":"0.0.36","@types/content-disposition":"0.5.4","@types/content-type":"1.1.3","@types/cookie":"0.3.3","@types/cross-spawn":"6.0.0","@types/debug":"4.1.5","@types/express-serve-static-core":"4.17.33","@types/fresh":"0.5.0","@types/glob":"7.1.1","@types/jsonwebtoken":"9.0.0","@types/lodash":"4.14.198","@types/lodash.curry":"4.1.6","@types/path-to-regexp":"1.7.0","@types/picomatch":"2.3.3","@types/platform":"1.3.4","@types/react":"19.0.8","@types/react-dom":"19.0.3","@types/react-is":"18.2.4","@types/semver":"7.3.1","@types/send":"0.14.4","@types/serve-handler":"6.1.4","@types/shell-quote":"1.7.1","@types/text-table":"0.2.1","@types/ua-parser-js":"0.7.36","@types/webpack-sources1":"npm:@types/webpack-sources@0.1.5","@types/ws":"8.2.0","@vercel/ncc":"0.34.0","@vercel/nft":"0.27.1","@vercel/routing-utils":"5.2.0","@vercel/turbopack-ecmascript-runtime":"*",acorn:"8.14.0",anser:"1.4.9",arg:"4.1.0",assert:"2.0.0","async-retry":"1.2.3","async-sema":"3.0.0","axe-playwright":"2.0.3","babel-loader":"10.0.0","babel-plugin-react-compiler":"0.0.0-experimental-1371fcb-20260227","babel-plugin-transform-define":"2.0.0","babel-plugin-transform-react-remove-prop-types":"0.4.24","browserify-zlib":"0.2.0",browserslist:"4.28.1",buffer:"5.6.0",busboy:"1.6.0",bytes:"3.1.1","ci-info":"watson/ci-info#f43f6a1cefff47fb361c88cf4b943fdbcaafe540","cli-select":"1.1.2","client-only":"0.0.1",commander:"12.1.0","comment-json":"3.0.3",compression:"1.7.4",conf:"5.0.0","constants-browserify":"1.0.0","content-disposition":"0.5.3","content-type":"1.0.4",cookie:"0.4.1","cross-env":"6.0.3","cross-spawn":"7.0.3","crypto-browserify":"3.12.0","css-loader":"7.1.2","css.escape":"1.5.1","cssnano-preset-default":"7.0.6","data-uri-to-buffer":"3.0.1",debug:"4.1.1",devalue:"2.0.1","domain-browser":"4.19.0","edge-runtime":"4.0.1",events:"3.3.0","find-up":"4.1.0",fresh:"0.5.2",glob:"7.1.7","gzip-size":"5.1.1","http-proxy":"1.18.1","http-proxy-agent":"5.0.0","https-browserify":"1.0.0","https-proxy-agent":"5.0.1","icss-utils":"5.1.0","ignore-loader":"0.1.2","image-size":"1.2.1","ipaddr.js":"2.2.0","is-docker":"2.0.0","is-wsl":"2.2.0","jest-worker":"27.5.1",json5:"2.2.3",jsonwebtoken:"9.0.0","loader-runner":"4.3.0","loader-utils2":"npm:loader-utils@2.0.4","loader-utils3":"npm:loader-utils@3.1.3","lodash.curry":"4.1.1","mini-css-extract-plugin":"2.4.4",msw:"2.3.0",nanoid:"3.1.32","native-url":"0.3.4","neo-async":"2.6.1","node-html-parser":"5.3.3",ora:"4.0.4","os-browserify":"0.3.0","p-limit":"3.1.0","p-queue":"6.6.2","path-browserify":"1.0.1","path-to-regexp":"6.3.0",picomatch:"4.0.1","postcss-flexbugs-fixes":"5.0.2","postcss-modules-extract-imports":"3.0.0","postcss-modules-local-by-default":"4.2.0","postcss-modules-scope":"3.0.0","postcss-modules-values":"4.0.0","postcss-preset-env":"7.4.3","postcss-safe-parser":"6.0.0","postcss-scss":"4.0.3","postcss-value-parser":"4.2.0",process:"0.11.10",punycode:"2.1.1","querystring-es3":"0.2.1","raw-body":"2.4.1","react-refresh":"0.12.0",recast:"0.23.11","regenerator-runtime":"0.13.4","safe-stable-stringify":"2.5.0","sass-loader":"16.0.5","schema-utils2":"npm:schema-utils@2.7.1","schema-utils3":"npm:schema-utils@3.0.0",semver:"7.3.2",send:"0.18.0","serve-handler":"6.1.6","server-only":"0.0.1",setimmediate:"1.0.5","shell-quote":"1.7.3","source-map":"0.6.1","source-map-loader":"5.0.0","source-map08":"npm:source-map@0.8.0-beta.0","stacktrace-parser":"0.1.10",storybook:"8.6.0","stream-browserify":"3.0.0","stream-http":"3.1.1","strict-event-emitter":"0.5.0","string-hash":"1.1.3",string_decoder:"1.3.0","strip-ansi":"6.0.0","style-loader":"4.0.0",superstruct:"1.0.3",tar:"7.5.11",taskr:"1.1.0",terser:"5.27.0","terser-webpack-plugin":"5.3.9","text-table":"0.2.0","timers-browserify":"2.0.12","tty-browserify":"0.0.1",typescript:"5.9.2","ua-parser-js":"1.0.35",unistore:"3.4.1",util:"0.12.4","vm-browserify":"1.1.2",watchpack:"2.4.0","web-vitals":"4.2.1",webpack:"5.98.0","webpack-sources1":"npm:webpack-sources@1.4.3","webpack-sources3":"npm:webpack-sources@3.2.3",ws:"8.2.3",zod:"3.25.76","zod-validation-error":"3.4.0"},keywords:["react","framework","nextjs","web","server","node","front-end","backend","cli","vercel"],engines:{node:">=20.9.0"}}},83492,e=>{"use strict";var t=e.i(36345);let s=function(){var e;if(!(null==(e=t.default)?void 0:e.version))return!1;let s=parseInt(t.default.version.split(".")[0],10);return!isNaN(s)&&s>=16}();e.s(["isNext16OrHigher",0,s,"middlewareFileReference",0,s?"middleware or proxy":"middleware"])},22909,e=>{"use strict";var t=e.i(81894);let s=null;function r(){if(!s){if(!process.env.DATABASE_URL)throw Error("DATABASE_URL environment variable is not set");s=(0,t.neon)(process.env.DATABASE_URL)}return s}async function a(e,t,s){return r()`
    INSERT INTO users (clerk_id, email, name)
    VALUES (${e}, ${t}, ${s})
    ON CONFLICT (clerk_id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, users.name)
    RETURNING *
  `}async function n(e){return r()`
    SELECT 
      fm.id,
      fm.family_id,
      fm.user_id,
      fm.role,
      fm.joined_at,
      u.name AS user_name,
      u.email AS user_email
    FROM family_members fm
    INNER JOIN users u ON u.id = fm.user_id
    WHERE fm.family_id = ${e}
    ORDER BY 
      CASE fm.role 
        WHEN 'owner' THEN 1 
        WHEN 'admin' THEN 2 
        ELSE 3 
      END,
      fm.joined_at ASC
  `}async function i(e,t=50){return r()`
    SELECT 
      n.id,
      n.user_id,
      n.type,
      n.related_id,
      n.message,
      n.read,
      n.created_at,
      CASE 
        WHEN n.type = 'post_created' THEN p.content
        WHEN n.type = 'event_reminder' THEN e.title
        ELSE NULL
      END AS related_title
    FROM notifications n
    LEFT JOIN posts p ON n.type = 'post_created' AND n.related_id = p.id
    LEFT JOIN events e ON n.type = 'event_reminder' AND n.related_id = e.id
    WHERE n.user_id = ${e}
    ORDER BY n.created_at DESC
    LIMIT ${t}
  `}async function o(e,t){await r()`
    UPDATE notifications 
    SET read = TRUE 
    WHERE id = ${e} AND user_id = ${t}
  `}async function l(e){await r()`
    UPDATE notifications 
    SET read = TRUE 
    WHERE user_id = ${e} AND read = FALSE
  `}e.s(["getFamilyMembers",0,n,"getNotificationsByUserId",0,i,"markAllNotificationsRead",0,l,"markNotificationRead",0,o,"sql",0,r,"upsertUser",0,a])},47328,e=>{"use strict";var t=e.i(89120),s=e.i(28536),r=e.i(5944),a=e.i(36354),n=e.i(97397),i=e.i(76039),o=e.i(56070),l=e.i(55789),p=e.i(28364),d=e.i(67522),c=e.i(21450),u=e.i(18596),m=e.i(57387),y=e.i(45688),b=e.i(24853),f=e.i(93695);e.i(13003);var v=e.i(7730),x=e.i(17737),E=e.i(16114),h=e.i(22909);let _=h.sql;async function g(e,t){return(await (0,h.getFamilyMembers)(e)).some(e=>e.user_id===t)}function w(e,t,s=new Date){return{serverPosition:Math.max(0,e+(s.getTime()-t.getTime())/1e3),serverTimestamp:s}}async function R(e){try{let{userId:t}=await (0,E.auth)();if(!t)return x.NextResponse.json({error:"Unauthorized"},{status:401});let s=e.nextUrl.searchParams.get("familyId");if(!s)return x.NextResponse.json({error:"familyId query param required"},{status:400});if(!await g(s,t))return x.NextResponse.json({error:"Forbidden: not a family member"},{status:403});let r=await _`
      SELECT
        ts.id,
        ts.family_id,
        ts.video_id,
        ts.broadcaster_id,
        ts.playback_position_seconds,
        ts.active,
        ts.channel_number,
        ts.started_at,
        ts.server_clock,
        ts.created_at,
        u.name AS broadcaster_name,
        u.email AS broadcaster_email,
        p.content AS video_caption,
        p.media_url AS video_url
      FROM tv_sessions ts
      LEFT JOIN users u ON u.id = ts.broadcaster_id
      LEFT JOIN posts p ON p.id = ts.video_id
      WHERE ts.family_id = ${s} AND ts.active = TRUE
      ORDER BY ts.started_at DESC
      LIMIT 1
    `;if(0===r.length)return x.NextResponse.json({session:null},{status:200});let a=r[0],{serverPosition:n,serverTimestamp:i}=w(a.playback_position_seconds,new Date(a.server_clock)),o=await _`
      SELECT
        q.id,
        q.video_id,
        q.position,
        q.source,
        q.created_at,
        u.name AS added_by_name,
        p.media_url AS video_thumbnail
      FROM tv_queue q
      LEFT JOIN users u ON u.id = q.added_by_user_id
      LEFT JOIN posts p ON p.id = q.video_id
      WHERE q.family_id = ${s}
        AND q.channel_number = ${a.channel_number}
        AND q.played = FALSE
      ORDER BY q.position ASC
      LIMIT 10
    `,l=await _`
      SELECT
        tp.user_id,
        tp.solo_mode,
        tp.joined_at,
        u.name AS user_name
      FROM tv_presence tp
      LEFT JOIN users u ON u.id = tp.user_id
      WHERE tp.session_id = ${a.id}
        AND tp.last_heartbeat_at > NOW() - INTERVAL '60 seconds'
      ORDER BY tp.joined_at ASC
    `;return x.NextResponse.json({session:{...a,serverPosition:n,serverTimestamp:i},queue:o,presence:l})}catch(e){return console.error("[GET /api/tv/sessions] Error:",e),x.NextResponse.json({error:"Internal server error"},{status:500})}}async function N(e){try{let{userId:t}=await (0,E.auth)();if(!t)return x.NextResponse.json({error:"Unauthorized"},{status:401});let{familyId:s,videoId:r,channelNumber:a}=await e.json();if(!s||"string"!=typeof s)return x.NextResponse.json({error:"familyId is required"},{status:400});if(!r||"string"!=typeof r)return x.NextResponse.json({error:"videoId is required"},{status:400});if(!await g(s,t))return x.NextResponse.json({error:"Forbidden: not a family member"},{status:403});let n=await _`
      SELECT id FROM users WHERE clerk_id = ${t}
    `;if(!n||0===n.length)return x.NextResponse.json({error:"User not found in database"},{status:404});let i=n[0].id;await _`
      UPDATE tv_sessions
      SET active = FALSE
      WHERE family_id = ${s} AND active = TRUE
    `;let o=new Date,l=(await _`
      INSERT INTO tv_sessions
        (family_id, video_id, broadcaster_id, playback_position_seconds, active, channel_number, server_clock)
      VALUES (${s}, ${r}, ${i}, 0, TRUE, ${a&&a>=1&&a<=5?a:1}, ${o})
      RETURNING *
    `)[0];await _`
      INSERT INTO tv_presence (session_id, user_id, solo_mode)
      VALUES (${l.id}, ${i}, FALSE)
      ON CONFLICT (session_id, user_id) DO UPDATE SET
        solo_mode = FALSE,
        last_heartbeat_at = NOW()
    `,await _`
      INSERT INTO tv_sync_events
        (session_id, family_id, actor_id, action, playback_position_seconds, video_id, server_timestamp)
      VALUES (${l.id}, ${s}, ${i}, 'video_change', 0, ${r}, ${o})
    `;let{serverPosition:p,serverTimestamp:d}=w(0,o);return x.NextResponse.json({session:{...l,serverPosition:p,serverTimestamp:d}},{status:201})}catch(e){return console.error("[POST /api/tv/sessions] Error:",e),x.NextResponse.json({error:"Internal server error"},{status:500})}}e.s(["GET",0,R,"POST",0,N],5592);var j=e.i(5592);let k=new t.AppRouteRouteModule({definition:{kind:s.RouteKind.APP_ROUTE,page:"/api/tv/sessions/route",pathname:"/api/tv/sessions",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/familytv/src/app/api/tv/sessions/route.ts",nextConfigOutput:"",userland:j}),{workAsyncStorage:T,workUnitAsyncStorage:A,serverHooks:S}=k;async function O(e,t,r){r.requestMeta&&(0,a.setRequestMeta)(e,r.requestMeta),k.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let x="/api/tv/sessions/route";x=x.replace(/\/index$/,"")||"/";let E=await k.prepare(e,t,{srcPage:x,multiZoneDraftMode:!1});if(!E)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:h,params:_,nextConfig:g,parsedUrl:w,isDraftMode:R,prerenderManifest:N,routerServerContext:j,isOnDemandRevalidate:T,revalidateOnlyGenerated:A,resolvedPathname:S,clientReferenceManifest:O,serverActionsManifest:C}=E,D=(0,o.normalizeAppPath)(x),I=!!(N.dynamicRoutes[D]||N.routes[S]),q=async()=>((null==j?void 0:j.render404)?await j.render404(e,t,w,!1):t.end("This page could not be found"),null);if(I&&!R){let e=!!N.routes[S],t=N.dynamicRoutes[D];if(t&&!1===t.fallback&&!e){if(g.adapterPath)return await q();throw new f.NoFallbackError}}let L=null;!I||k.isDev||R||(L="/index"===(L=S)?"/":L);let U=!0===k.isDev||!I,$=I&&!U;C&&O&&(0,i.setManifestsSingleton)({page:x,clientReferenceManifest:O,serverActionsManifest:C});let H=e.method||"GET",P=(0,n.getTracer)(),F=P.getActiveScopeSpan(),M=!!(null==j?void 0:j.isWrappedByNextServer),W=!!(0,a.getRequestMeta)(e,"minimalMode"),B=(0,a.getRequestMeta)(e,"incrementalCache")||await k.getIncrementalCache(e,g,N,W);null==B||B.resetRequestCache(),globalThis.__incrementalCache=B;let z={params:_,previewProps:N.preview,renderOpts:{experimental:{authInterrupts:!!g.experimental.authInterrupts},cacheComponents:!!g.cacheComponents,supportsDynamicResponse:U,incrementalCache:B,cacheLifeProfiles:g.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,s,r,a)=>k.onRequestError(e,t,r,a,j)},sharedContext:{buildId:h}},V=new l.NodeNextRequest(e),G=new l.NodeNextResponse(t),J=p.NextRequestAdapter.fromNodeNextRequest(V,(0,p.signalFromNodeResponse)(t));try{let a,i=async e=>k.handle(J,z).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let s=P.getRootSpanAttributes();if(!s)return;if(s.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${s.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let r=s.get("next.route");if(r){let t=`${H} ${r}`;e.setAttributes({"next.route":r,"http.route":r,"next.span_name":t}),e.updateName(t),a&&a!==e&&(a.setAttribute("http.route",r),a.updateName(t))}else e.updateName(`${H} ${x}`)}),o=async a=>{var n,o;let l=async({previousCacheEntry:s})=>{try{if(!W&&T&&A&&!s)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let n=await i(a);e.fetchMetrics=z.renderOpts.fetchMetrics;let o=z.renderOpts.pendingWaitUntil;o&&r.waitUntil&&(r.waitUntil(o),o=void 0);let l=z.renderOpts.collectedTags;if(!I)return await (0,u.sendResponse)(V,G,n,z.renderOpts.pendingWaitUntil),null;{let e=await n.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(n.headers);l&&(t[b.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let s=void 0!==z.renderOpts.collectedRevalidate&&!(z.renderOpts.collectedRevalidate>=b.INFINITE_CACHE)&&z.renderOpts.collectedRevalidate,r=void 0===z.renderOpts.collectedExpire||z.renderOpts.collectedExpire>=b.INFINITE_CACHE?void 0:z.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:n.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:s,expire:r}}}}catch(t){throw(null==s?void 0:s.isStale)&&await k.onRequestError(e,t,{routerKind:"App Router",routePath:x,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:$,isOnDemandRevalidate:T})},!1,j),t}},p=await k.handleResponse({req:e,nextConfig:g,cacheKey:L,routeKind:s.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:N,isRoutePPREnabled:!1,isOnDemandRevalidate:T,revalidateOnlyGenerated:A,responseGenerator:l,waitUntil:r.waitUntil,isMinimalMode:W});if(!I)return null;if((null==p||null==(n=p.value)?void 0:n.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==p||null==(o=p.value)?void 0:o.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});W||t.setHeader("x-nextjs-cache",T?"REVALIDATED":p.isMiss?"MISS":p.isStale?"STALE":"HIT"),R&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let d=(0,m.fromNodeOutgoingHttpHeaders)(p.value.headers);return W&&I||d.delete(b.NEXT_CACHE_TAGS_HEADER),!p.cacheControl||t.getHeader("Cache-Control")||d.get("Cache-Control")||d.set("Cache-Control",(0,y.getCacheControlHeader)(p.cacheControl)),await (0,u.sendResponse)(V,G,new Response(p.value.body,{headers:d,status:p.value.status||200})),null};M&&F?await o(F):(a=P.getActiveScopeSpan(),await P.withPropagatedContext(e.headers,()=>P.trace(d.BaseServerSpan.handleRequest,{spanName:`${H} ${x}`,kind:n.SpanKind.SERVER,attributes:{"http.method":H,"http.target":e.url}},o),void 0,!M))}catch(t){if(t instanceof f.NoFallbackError||await k.onRequestError(e,t,{routerKind:"App Router",routePath:D,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:$,isOnDemandRevalidate:T})},!1,j),I)throw t;return await (0,u.sendResponse)(V,G,new Response(null,{status:500})),null}}e.s(["handler",0,O,"patchFetch",0,function(){return(0,r.patchFetch)({workAsyncStorage:T,workUnitAsyncStorage:A})},"routeModule",0,k,"serverHooks",0,S,"workAsyncStorage",0,T,"workUnitAsyncStorage",0,A],47328)},1727,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__0u7afi~._.js"].map(t=>e.l(t))).then(()=>t(97993)))},62162,e=>{e.v(t=>Promise.all(["server/chunks/03oy_next_03yx.yt._.js"].map(t=>e.l(t))).then(()=>t(80350)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__07rru94._.js.map