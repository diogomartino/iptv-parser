# iptv-parser
This is a script that will crawl https://iptvcat.com and test all the m3u8 streams to check which are online, the metadata (resolution, bitrate, fps, etc.) and export all the working streams to a list.

## Requirements
- NodeJS LTS
- If you are on Linux you probably need ffmpeg dependencies

## Instructions
1. Clone this repo
2. Host `/web/vmdfWQEjsd.php` somewhere ([What?](https://000webhost.com))
3. Rename files `.env.example` to `.env` and `list.json.example` to `list.json`
4. Edit `.env` and on `PHP_SCRIPT` add the URL to the PHP script you just hosted
5. Edit `list.json` with the channels you want, just follow the structure already there
6. Run `npm install`
7. Run `node app.js`
8. The list will be exported to the same directory your PHP script is hosted as `iptv.txt` and accessible by `http(s)://your.host/iptv.txt`
9. Add your `http(s)://your.host/iptv.txt` link to any IPTV client and have fun

## Other stuff (READ)
- Of course this is for education purposes only (I was bored).
- If a stream is on the final list, it's 100% alive. This doesn't mean it's NOT lagging and it has good quality. It's just alive.
- If a stream was tagged as offline it most likely is.