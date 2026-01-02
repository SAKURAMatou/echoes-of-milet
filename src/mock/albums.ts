// mock/albums.ts
import type { Work } from '@/composables/releaseType'

export const albums: Work[] = [
  {
    id: 'work-visions',
    title: 'visions',
    artist: 'milet',
    releaseType: 'ALBUM',
    coverUrl: 'https://api.miles-dml.org/static/milet/img/covers/milet_-_visions_lim_A.jpg',
    editions: [
      {
        id: 'rel-visions-standard',
        editionName: '通常盤',
        releaseDate: '2023-10-04',
        discs: [
          {
            id: 'disc-std-1',
            no: 1,
            tracks: [
              { id: 't-001', no: 1, title: 'Higher', durationSec: 252 },
              { id: 't-002', no: 2, title: 'Ordinary days', durationSec: 238 },
              { id: 't-003', no: 3, title: 'Hey Song', durationSec: 261 },
              { id: 't-004', no: 4, title: 'Flare', durationSec: 245 },
            ],
          },
        ],
      },
      {
        id: 'rel-visions-limited',
        editionName: '初回限定盤',
        releaseDate: '2023-10-04',
        discs: [
          {
            id: 'disc-lim-1',
            no: 1,
            tracks: [
              { id: 't-001', no: 1, title: 'Higher', durationSec: 252 },
              { id: 't-002', no: 2, title: 'Ordinary days', durationSec: 238 },
              { id: 't-003', no: 3, title: 'Hey Song', durationSec: 261 },
              { id: 't-004', no: 4, title: 'Flare', durationSec: 245 },
            ],
          },
          {
            id: 'disc-lim-2',
            no: 2,
            title: 'Bonus Disc',
            tracks: [
              { id: 't-b01', no: 1, title: 'Higher (Live)', durationSec: 275 },
              { id: 't-b02', no: 2, title: 'Flare (Acoustic)', durationSec: 230 },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'work-eyes',
    title: 'eyes',
    artist: 'milet',
    releaseType: 'ALBUM',
    coverUrl: 'https://api.miles-dml.org/static/milet/img/covers/milet_-_eyes_lim_A.jpg',
    editions: [
      {
        id: 'rel-eyes-standard',
        editionName: '通常盤',
        releaseDate: '2022-06-01',
        discs: [
          {
            id: 'disc-eyes-1',
            no: 1,
            tracks: [
              { id: 't-101', no: 1, title: 'us', durationSec: 240 },
              { id: 't-102', no: 2, title: 'Prover', durationSec: 228 },
              { id: 't-103', no: 3, title: 'Drown', durationSec: 255 },
            ],
          },
        ],
      },
    ],
  },
]
