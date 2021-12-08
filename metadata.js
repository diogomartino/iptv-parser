const fs = require('fs');
const m3u8stream = require('m3u8stream');
const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');

const getStreamMetaData = (streamUrl) => {
    return new Promise((resolve, reject) => {
        let stream = null;

        const endTimeout = setTimeout(() => {
            if (stream) {
                stream.end();
            } else {
                reject();
            }
        }, process.env.PIPE_TIMEOUT_SEC * 1000);

        stream = m3u8stream(streamUrl);
        const start = new Date().getTime() / 1000;
        const end = start + process.env.DOWNLOAD_SEC;

        stream.on('data', function (x) {
            if ((new Date().getTime() / 1000) >= end) {
                stream.end();
            }
        });
        stream.on('end', () => {
            clearTimeout(endTimeout);

            const probeTimeout = setTimeout(() => {
                reject();
            }, process.env.FFPROBE_TIMEOUT_SEC * 1000);

            ffprobe(process.env.STREAM_FILE, { path: process.platform === 'win32' ? ffprobeStatic.path : `${process.cwd()}/ffprobe` })
                .then((info) => {
                    clearTimeout(probeTimeout);

                    const data = {
                        fps: info.streams[0].avg_frame_rate.split('/')[0],
                        codecName: info.streams[0].codec_long_name,
                        codec: info.streams[0].codec_name,
                        bitrate: info.streams[0].bit_rate,
                        calculatedBitrate: Math.round((Math.round(fs.statSync(process.env.STREAM_FILE).size / 1024) / ((info.streams[0].duration / 60) * 0.0075)) / 1024),
                        resolution: info.streams[0].height + 'P',
                        alive: true
                    }

                    resolve(data);
                })
                .catch((error) => {
                    clearTimeout(probeTimeout);
                    reject(error);
                });
        });
        stream.on('error', (error) => reject(error));
        stream.pipe(fs.createWriteStream(process.env.STREAM_FILE));
    });
}

module.exports = getStreamMetaData;