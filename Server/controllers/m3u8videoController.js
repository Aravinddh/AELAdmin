const fs = require("fs");
const path = require("path");
const m3u8Parser = require("m3u8-parser");
const Movie = require("../models/Movie");
const TimestampSubmission = require("../models/Submission");

function createDateRangeTag(marker) {
    const baseTime = new Date("2025-06-29T12:00:00Z").getTime(); // fixed start
    const isoTime = new Date(baseTime + marker.timestamp * 1000).toISOString();
    const id = `engage_${marker.formId}`;
    return `#EXT-X-DATERANGE:ID="${id}",START-DATE="${isoTime}",CLASS="form",X-FORM-ID="${marker.formId}",X-TIMESTAMP="${marker.selectedSegment.end}"`;
}

exports.serveM3U8WithMarkers = async (req, res) => {
    try {
        const videoId = req.params.id;
        const video = await Movie.findById(videoId);
        if (!video) return res.status(404).send("Video not found");

        const submission = await TimestampSubmission.findOne({ videoId });
        const m3u8Path = path.join(__dirname, "..", video.m3u8Path);
        if (!fs.existsSync(m3u8Path)) return res.status(404).send("M3U8 not found");

        const m3u8Content = fs.readFileSync(m3u8Path, "utf8");
        const parser = new m3u8Parser.Parser();
        parser.push(m3u8Content);
        parser.end();

        const segmentInfos = [];
        let currentTime = 0;
        for (const seg of parser.manifest.segments) {
            segmentInfos.push({
                uri: seg.uri,
                duration: seg.duration,
                start: currentTime,
                end: currentTime + seg.duration,
            });
            currentTime += seg.duration;
        }

        const modifiedLines = [];

        const originalLines = m3u8Content.split('\n');
        for (const line of originalLines) {
            if (line.startsWith('#EXTINF') || line.endsWith('.ts')) break;
            modifiedLines.push(line);
        }

        // Add each segment and check for matching marker
        for (const segment of segmentInfos) {
            modifiedLines.push(`#EXTINF:${segment.duration},`);

            const movieDir = path.dirname(video.m3u8Path);
            const segmentURL = path.join('/', movieDir, segment.uri).replace(/\\/g, '/');
            modifiedLines.push(segmentURL);

            const marker = submission?.selections?.find(sel => sel.selectedSegment.segment === segment.uri);
            if (marker) {
                modifiedLines.push(createDateRangeTag(marker));
            }
        }


        modifiedLines.push("#EXT-X-ENDLIST");
        console.log(modifiedLines.join("\n"));
       res.setHeader("Content-Type", "application/x-mpegURL");
        res.setHeader("Access-Control-Allow-Origin", "*");  
        res.send(modifiedLines.join('\n'));
    } catch (err) {
        console.error("Error:", err);
        res.status(500).send("Server error");
    }
};
