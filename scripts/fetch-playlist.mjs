import { writeFile } from 'node:fs/promises';

const KEY = process.env.YT_API_KEY;
const PLAYLIST = process.argv[2];
const out = [];
let token = '';

do {
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST}&key=${KEY}&pageToken=${token}`;
  const data = await (await fetch(url)).json();
console.log(JSON.stringify(data, null, 2));
  for (const it of data.items) {
    out.push({
      id: it.snippet.resourceId.videoId,
      title: it.snippet.title,
      artist: (it.snippet.videoOwnerChannelTitle || '').replace(/ - Topic$/, '')
    });
  }
  token = data.nextPageToken || '';
} while (token);

await writeFile('data/tracks.json', JSON.stringify(out, null, 2));
console.log(`Saved ${out.length} tracks`);