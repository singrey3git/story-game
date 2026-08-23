// Three example-film images per plot type, hand-picked and supplied for this
// project. Importing them (rather than referencing /public paths) lets Vite
// hash and bundle them correctly under GitHub Pages' sub-path base URL.

import overcoming1 from '../assets/plots/overcoming-the-monster/1.jpg'
import overcoming2 from '../assets/plots/overcoming-the-monster/2.jpg'
import overcoming3 from '../assets/plots/overcoming-the-monster/3.jpg'

import rags1 from '../assets/plots/rags-to-riches/1.jpg'
import rags2 from '../assets/plots/rags-to-riches/2.jpg'
import rags3 from '../assets/plots/rags-to-riches/3.jpg'

import quest1 from '../assets/plots/quest/1.jpg'
import quest2 from '../assets/plots/quest/2.jpg'
import quest3 from '../assets/plots/quest/3.jpg'

import voyage1 from '../assets/plots/voyage-and-return/1.jpg'
import voyage2 from '../assets/plots/voyage-and-return/2.jpg'
import voyage3 from '../assets/plots/voyage-and-return/3.jpg'

import comedy1 from '../assets/plots/comedy/1.jpg'
import comedy2 from '../assets/plots/comedy/2.jpg'
import comedy3 from '../assets/plots/comedy/3.jpg'

import tragedy1 from '../assets/plots/tragedy/1.jpg'
import tragedy2 from '../assets/plots/tragedy/2.jpg'
import tragedy3 from '../assets/plots/tragedy/3.jpg'

import rebirth1 from '../assets/plots/rebirth/1.jpg'
import rebirth2 from '../assets/plots/rebirth/2.jpg'
import rebirth3 from '../assets/plots/rebirth/3.jpg'

import sacrifice1 from '../assets/plots/self-sacrifice/1.jpg'
import sacrifice2 from '../assets/plots/self-sacrifice/2.jpg'
import sacrifice3 from '../assets/plots/self-sacrifice/3.jpg'

import rebellion1 from '../assets/plots/rebellion/1.jpg'
import rebellion2 from '../assets/plots/rebellion/2.jpg'
import rebellion3 from '../assets/plots/rebellion/3.jpg'

export const PLOT_EXAMPLES = {
  'overcoming-the-monster': [overcoming1, overcoming2, overcoming3],
  'rags-to-riches': [rags1, rags2, rags3],
  quest: [quest1, quest2, quest3],
  'voyage-and-return': [voyage1, voyage2, voyage3],
  comedy: [comedy1, comedy2, comedy3],
  tragedy: [tragedy1, tragedy2, tragedy3],
  rebirth: [rebirth1, rebirth2, rebirth3],
  'self-sacrifice': [sacrifice1, sacrifice2, sacrifice3],
  rebellion: [rebellion1, rebellion2, rebellion3],
}

export function getPlotExamples(plotId) {
  return PLOT_EXAMPLES[plotId] || []
}
