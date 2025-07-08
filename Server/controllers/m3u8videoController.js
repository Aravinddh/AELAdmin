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
    console.log('M3U8Controller - serveM3U8WithMarkers called with ID:', req.params.id);
    console.log('M3U8Controller - ID type:', typeof req.params.id);
    
    try {
        const video = await Movie.findById(req.params.id);
        if (!video) {
            console.log('M3U8Controller - Video not found for ID:', req.params.id);
            return res.status(404).send("Video not found");
        }
        
        console.log('M3U8Controller - Found video:', video.title);
        console.log('M3U8Controller - Video m3u8Path:', video.m3u8Path);

        const submission = await TimestampSubmission.findOne({ videoId: video._id });
        const selections = submission?.selections || [];
        console.log('M3U8Controller - Found selections:', selections.length);

        const m3u8Path = path.join(__dirname, "..", video.m3u8Path);
        console.log('M3U8Controller - Full M3U8 path:', m3u8Path);
        
        if (!fs.existsSync(m3u8Path)) {
            console.log('M3U8Controller - M3U8 file not found at path:', m3u8Path);
            return res.status(404).send("M3U8 not found");
        }
        
        console.log('M3U8Controller - M3U8 file exists, reading content...');

        const lines = fs.readFileSync(m3u8Path, "utf8").split('\n');
        console.log('M3U8Controller - M3U8 file has', lines.length, 'lines');
        
        const modifiedLines = [];
        let segmentCount = 0;
        
        const movieDir = path.dirname(video.m3u8Path); 
        const movieDirName = path.basename(movieDir); 

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            console.log(`M3U8Controller - Processing line ${i}: "${line}"`);

            if (line && line.includes('.ts') && !line.startsWith('#')) {
                segmentCount++;
                console.log(`M3U8Controller - Found segment ${segmentCount}: ${line}`);
                

                const segmentUrl = `/assets/${movieDirName}/${line}`;
                console.log(`M3U8Controller - Segment URL: ${segmentUrl}`);
                modifiedLines.push(segmentUrl);
                
                const marker = selections.find(sel => sel.selectedSegment.segment === line);
                if (marker) {
                    console.log(`M3U8Controller - Adding marker for segment: ${line}`);
                    modifiedLines.push(createDateRangeTag(marker));
                }
            } else {

                modifiedLines.push(lines[i]);
            }
        }

        console.log('M3U8Controller - Total segments found:', segmentCount);
        console.log('M3U8Controller - Modified M3U8 has', modifiedLines.length, 'lines');
        console.log('M3U8Controller - First few lines:', modifiedLines.slice(0, 10));

        res.setHeader("Content-Type", "application/x-mpegURL");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.send(modifiedLines.join('\n'));
        
        console.log('M3U8Controller - M3U8 response sent successfully');
    } catch (err) {
        console.error("M3U8Controller - Serve M3U8 error:", err);
        res.status(500).send("Server error");
    }
};
