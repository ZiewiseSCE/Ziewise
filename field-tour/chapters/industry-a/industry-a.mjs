import {kit} from './industry-fixtures.mjs';
import {energy} from './industry-energy.mjs';
import {commerce} from './industry-commerce.mjs';

/** Standalone customer environment. Local +Z is the visitor side, Y is up.
 * All objects and phase anchors are station-local. ready waits for optional
 * photographic surfaces; geometry, labels and instrument actions exist at once.
 */
export function buildIndustryA(T,id) {
  const build=id==='energy'?energy:id==='commerce'?commerce:null;
  if(!build)throw new Error('Unknown industry station '+id);
  const context=kit(T),group=new T.Group();group.name='Customer experience / '+id;
  const state=build(context,group);
  const update=p=>state.update(Math.max(0,Math.min(1,Number.isFinite(p)?p:0)));
  update(0);
  return {group,anchors:state.anchors,update,ready:Promise.all(context.promises)};
}
