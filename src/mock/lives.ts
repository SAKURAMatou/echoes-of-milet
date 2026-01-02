// mock/lives.ts
import type { Work } from '@/composables/releaseType'

export const lives: Work[] = [
  {
    id: 'work-live-2023',
    title: 'milet Live Tour 2023',
    artist: 'milet',
    releaseType: 'LIVE_BD',
    releaseDate: '2024-02-14',
    coverUrl: '/covers/live-2023.jpg',
    editions: [
      {
        id: 'rel-live-2023-bd',
        editionName: 'Blu-ray',
        releaseDate: '2024-02-14',
        discs: [
          {
            id: 'disc-live-1',
            no: 1,
            title: 'Main Live',
            tracks: [
              { id: 't-l01', no: 1, title: 'Prover (Live)', durationSec: 290 },
              { id: 't-l02', no: 2, title: 'Inside You (Live)', durationSec: 312 },
              { id: 't-l03', no: 3, title: 'Flare (Live)', durationSec: 305 },
            ],
          },
          {
            id: 'disc-live-2',
            no: 2,
            title: 'Encore',
            tracks: [{ id: 't-l04', no: 1, title: 'Ordinary days (Encore)', durationSec: 280 }],
          },
        ],
      },
    ],
  },
]
