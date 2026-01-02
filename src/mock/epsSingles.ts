// mock/epsSingles.ts
import type { Work } from '@/composables/releaseType'

export const epsSingles: Work[] = [
  {
    id: 'work-who-i-am',
    title: 'Who I Am',
    artist: 'milet',
    releaseType: 'EP',
    coverUrl: '/covers/who-i-am.jpg',
    editions: [
      {
        id: 'rel-who-i-am',
        editionName: 'Digital',
        releaseDate: '2020-08-19',
        discs: [
          {
            id: 'disc-ep-1',
            no: 1,
            tracks: [
              { id: 't-201', no: 1, title: 'Who I Am', durationSec: 226 },
              { id: 't-202', no: 2, title: 'Inside You', durationSec: 247 },
              { id: 't-203', no: 3, title: 'Again and Again', durationSec: 233 },
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'work-drown-single',
    title: 'Drown',
    artist: 'milet',
    releaseType: 'SINGLE',
    coverUrl: '/covers/drown.jpg',
    editions: [
      {
        id: 'rel-drown',
        editionName: 'Digital Single',
        releaseDate: '2019-10-02',
        discs: [
          {
            id: 'disc-single-1',
            no: 1,
            tracks: [{ id: 't-301', no: 1, title: 'Drown', durationSec: 255 }],
          },
        ],
      },
    ],
  },
]
