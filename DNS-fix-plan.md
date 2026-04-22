# DNS Performance Fix for evolution.new

## Root cause
All traffic (global + RU) routes through VPS 89.23.106.142.
This adds ~50-200ms latency for every visitor worldwide.

## Option A — Quick fix (keep VPS, fix Nginx)

Make Nginx send HTTP 302 redirects instead of proxying.
Redirect is 1 round-trip; proxying is a permanent relay of all data.

Steps:
1. `sudo apt install nginx libnginx-mod-http-geoip2`
2. Download GeoLite2-Country.mmdb from MaxMind (free, requires account)
3. Copy `nginx/evolution-geo-redirect.conf` to `/etc/nginx/sites-available/evolution`
4. Adjust `ssl_certificate` paths (run certbot if needed)
5. `sudo nginx -t && sudo systemctl reload nginx`

Result: VPS only handles the initial redirect (tiny load), then browser goes directly to destination.

## Option B — Best fix (Cloudflare Worker, no VPS needed)

Cloudflare has 300+ edge nodes globally. Geo-routing happens at the nearest node.
Russian visitors get redirected to ru.evolution.new (Yandex CDN).
Everyone else gets served ReadyMag content directly — zero extra hops.

Steps:
1. Add evolution.new to Cloudflare (free plan works)
2. In Namecheap: change nameservers to Cloudflare's
3. In Cloudflare DNS: keep `@` A record (Cloudflare will proxy it, orange cloud ON)
4. Deploy `cloudflare/worker.js` as a Worker
5. Add Worker route: `evolution.new/*` → your worker

**Note:** You'll need to find the correct ReadyMag origin hostname for your site
(check in ReadyMag dashboard under "Custom Domain" or contact their support).

## DNS records to keep as-is
- `ru` CNAME → Yandex Cloud CDN (this is already optimal)
- All other subdomains unchanged
