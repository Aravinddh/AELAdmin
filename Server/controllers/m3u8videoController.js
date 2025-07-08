const fs = require("fs");
const path = require("path");
const m3u8Parser = require("m3u8-parser");
const Movie = require("../models/Movie");
const TimestampSubmission = require("../models/Submission");

const createDateRangeTag = (marker) => {
    const baseTime = new Date("2025-06-29T12:00:00Z").getTime();
    const isoTime = new Date(baseTime + marker.timestamp * 1000).toISOString();
    return `#EXT-X-DATERANGE:ID="engage_${marker.formId}",START-DATE="${isoTime}",CLASS="form",X-FORM-ID="${marker.formId}",X-TIMESTAMP="${marker.selectedSegment.end}"`;
};

exports.serveM3U8WithMarkers = async (req, res) => {
    
    try {
        const video = await Movie.findById(req.params.id);
        if (!video) {
            return res.status(404).send("Video not found");
        }
       

        const submission = await TimestampSubmission.findOne({ videoId: video._id });
        const selections = submission?.selections || [];
        const m3u8Path = path.join(__dirname, "..", video.m3u8Path);
        
        if (!fs.existsSync(m3u8Path)) {
            return res.status(404).send("M3U8 not found");
        }
        const lines = fs.readFileSync(m3u8Path, "utf8").split('\n');
        
        const modifiedLines = [];
        let segmentCount = 0;
        
        const movieDir = path.dirname(video.m3u8Path); 
        const movieDirName = path.basename(movieDir); 

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line && line.includes('.ts') && !line.startsWith('#')) {
                segmentCount++;
                const segmentUrl = `/assets/${movieDirName}/${line}`;
                modifiedLines.push(segmentUrl);
                
                const marker = selections.find(sel => sel.selectedSegment.segment === line);
                if (marker) {
                    modifiedLines.push(createDateRangeTag(marker));
                }
            } else {

                modifiedLines.push(lines[i]);
            }
        }

        res.setHeader("Content-Type", "application/x-mpegURL");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.send(modifiedLines.join('\n'));
        
    } catch (err) {
        console.error("M3U8Controller - Serve M3U8 error:", err);
        res.status(500).send("Server error");
    }
};
