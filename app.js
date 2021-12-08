require('dotenv').config();
const cheerio = require('cheerio');
const axios = require('axios');
const getStreamMetaData = require('./metadata');
const fs = require('fs');

const list = fs.readFileSync('list.json');
let toCrawl = null;

try {
    toCrawl = JSON.parse(list);
    console.log(`Loaded ${toCrawl.length} elements from list.json`);
} catch (error) {
    console.error('Invalid list.json');
    return;
}

const data = [];
const date = new Date();
const now = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().padStart(4, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

(async () => {
    for (let e = 0; e < toCrawl.length; e++) {
        const crawl = toCrawl[e];

        const response = await axios({
            url: `https://iptvcat.com/${crawl.query}`,
            method: 'GET',
            responseType: 'blob',
        });

        const $ = cheerio.load(response.data);

        $('.stream_table:nth-child(2)>tbody').first().children().each(function () {
            if ($(this).hasClass('border-solid')) {
                try {
                    const id = $(this).attr('class').toString().split(' ')[1];

                    if (id.includes('belongs_to')) {
                        const infoElement = $(`.${id}`)[0];
                        const bitrate = $(infoElement).children().last().text().trim();
                        const health = $($(infoElement).children()[2]).find('div').first().text().trim();
                        const downloadElement = $(`.${id}`)[1];
                        const downloadLink = $(downloadElement).find('.get_vlc').attr('data-clipboard-text');

                        data.push({
                            name: crawl.name,
                            link: downloadLink,
                            bitrate: parseInt(bitrate),
                            health: parseInt(health),
                            logo: crawl.logo
                        });
                    }
                } catch { }
            }
        });
    }

    let listData = `#EXTM3U\n\n#EXTINF:-1 tvg-logo="https://i.imgur.com/HKfO6oJ.png",LISTA ATUALIZADA EM ${now}\nhttps://google.com/ignore_plz.m3u8\n\n`;

    for (let i = 0; i < data.length; i++) {
        const element = data[i];
        if (element.health > process.env.HEALTH_TRESHOLD && element.bitrate > process.env.BITRATE_THRESHOLD) {
            let data = null;

            try {
                data = await getStreamMetaData(element.link);
                console.log(`${element.link} is ONLINE`);
            } catch {
                console.log(`${element.link} is OFFLINE`);
                continue;
            }

            listData += `#EXTINF:-1 tvg-logo="${element.logo || ''}",${element.name} [${data.bitrate || data.calculatedBitrate} kbps] [${data.resolution}] [${data.codec}] [${data.fps == 0 ? '?' : data.fps} FPS] (${i})\n${element.link}\n\n`;
        }
    }

    const params = new URLSearchParams();
    params.append('list', listData.toString());

    axios.post(process.env.PHP_SCRIPT, params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        form: {
            list: listData.toString()
        }
    })
        .then(() => {
            try {
                fs.unlinkSync(process.env.STREAM_FILE);
            } catch { }

            console.log('Done');
        })
        .catch((error) => {
            console.error(error);
        });
})();